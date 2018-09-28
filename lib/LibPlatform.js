// homebridge-lib/lib/LibPlatform.js
//
// Library for homebridge plug-ins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.
//
// See https://github.com/ebaauw/homebridge-lib/wiki/LibPlatform.

'use strict'

const fakegatoHistory = require('fakegato-history')
const semver = require('semver')
const util = require('util')

const homebridgeLib = {
  EveHomeKitTypes: require('./EveHomeKitTypes'),
  LibObject: require('./LibObject'),
  MyHomeKitTypes: require('./MyHomeKitTypes'),
  RestClient: require('./RestClient'),
  UpnpMonitor: require('./UpnpMonitor')
}
const packageJson = require('../package.json')

const context = {
  platformName: '',
  pluginName: '',
  pluginVersion: '',
  libName: packageJson.name,
  libVersion: packageJson.version,
  nodeVersion: process.version,
  recommendedNodeVersion: packageJson.engines.node,
  homebridgeVersion: '',
  recommendedHomebridgeVersion: packageJson.engines.homebridge,
  maxAccessories: 99,
  maxServices: 99,
  maxCharacteristics: 99,
  checkInterval: 7 * 24 * 3600
}

// Abstract superclass for a homebridge platform plug-in.
module.exports = class LibPlatform extends homebridgeLib.LibObject {
  // Link this module to homebridge.
  // Called by homebridge, through index.js, when loading the plugin from the
  // plugin directory, typically /usr/lib/node_modules.
  static loadPlatform (homebridge, packageJson, platformName, Platform) {
    context.platformName = platformName
    context.pluginName = packageJson.name
    context.pluginVersion = packageJson.version
    context.homebridgeVersion = homebridge.serverVersion
    context.PlatformAccessory = homebridge.platformAccessory
    context.Accessory = { hap: homebridge.hap.Accessory }
    context.Service = { hap: homebridge.hap.Service }
    context.Characteristic = { hap: homebridge.hap.Characteristic }
    const eve = new homebridgeLib.EveHomeKitTypes(homebridge)
    context.Service.eve = eve.Service
    context.Characteristic.eve = eve.Characteristic
    const my = new homebridgeLib.MyHomeKitTypes(homebridge)
    context.Service.my = my.Service
    context.Characteristic.my = my.Characteristic
    homebridge.registerPlatform(
      context.pluginName, context.platformName, Platform, true
    )
  }

  // Return the minimum version in a semver range.
  static _minVersion (range) {
    let s = range.split(' ')[0]
    while (s) {
      if (semver.valid(s)) {
        break
      }
      s = s.substring(1)
    }
    return s || undefined
  }

  // Initialise the platform.
  // Called by homebridge (through subclass) when initialising the plugin from
  // config.json.
  constructor (log, configJson, homebridge) {
    super()
    this._log = log
    this._configJson = configJson
    this._homebridge = homebridge
    this._accessories = {}

    if (process.listenerCount('uncaughtException') === 0) {
      process.on('uncaughtException', this._uncaughtException.bind(this))
    }
    process.on('exit', this._exit.bind(this))
    this._identify()
    if (configJson == null) {
      this._homebridge.on('didFinishLaunching', this._cleanup.bind(this))
      return
    }
    this._homebridge.on('didFinishLaunching', this._main.bind(this))
    this._homebridge.on('shutdown', this._shutdown.bind(this))
    if (context.initialised) {
      this.fatal(
        'config.json: duplicate entry for %s platform', context.platformName
      )
    }
    context.initialised = true
    this._HistoryService = fakegatoHistory(homebridge)
    this._upnpConfig(configJson.upnp || {})
  }

  get Accessory () {
    return context.Accessory
  }

  get Service () {
    return context.Service
  }

  get Characteristic () {
    return context.Characteristic
  }

  // ===== Main ================================================================

  // Main platform function.
  // Called by homebridge after restoring accessories from cache.
  _main () {
    const n = Object.keys(this._accessories).length
    if (n > 0) {
      this.log('restored %d accessories from cache', n)
    }
    let beat = -1
    this._heartbeat = setInterval(() => {
      beat += 1
      this.emit('heartbeat', beat)
      if (beat % context.checkInterval === 0) {
        this._checkLatest()
      }
    }, 1000)
    this._upnpConfig(this._configJson.upnp || {})
    if (this.listenerCount('upnpDeviceAlive') > 0) {
      this._upnpMonitor.listen()
    }
    if (this.listenerCount('upnpDeviceFound') > 0) {
      this._upnpMonitor.search()
    }
  }

  // Called by homebridge when shutting down.
  _shutdown () {
    if (this._shuttingDown) {
      return
    }
    this._shuttingDown = true
    clearInterval(this._heartbeat)
    this.removeAllListeners('upnpDeviceAlive')
    this.removeAllListeners('upnpDeviceFound')
    this.debug('shutting down')
    this.emit('shutdown')
  }

  // Called by NodeJS when process is exiting.
  _exit () {
    this.debug('exit')
    this.emit('exit')
  }

  // Called by NodeJS when an uncaught exception occurs.
  _uncaughtException (error) {
    this.fatal('uncaught exception\n%s', error.stack)
  }

  // Issue an identity message.
  _identify () {
    const nodeVersion = LibPlatform._minVersion(context.recommendedNodeVersion)
    const homebridgeVersion = LibPlatform._minVersion(
      context.recommendedHomebridgeVersion
    )
    this.log(
      '%s v%s, node %s, homebridge v%s',
      context.pluginName, context.pluginVersion,
      context.nodeVersion, context.homebridgeVersion
    )
    this.debug('%s v%s', context.libName, context.libVersion)
    if (semver.clean(context.nodeVersion) !== nodeVersion) {
      this.warn('not using recommended node v%s LTS', nodeVersion)
    }
    if (context.homebridgeVersion !== homebridgeVersion) {
      this.warn(
        'not using recommended homebridge v%s', homebridgeVersion
      )
    }
    const n = Object.keys(this._accessories).length
    if (n > 0) {
      this.log('exposing %d/%d accessories', n, context.maxAccessories)
    }
    this.debug('config.json: %j', this._configJson)
  }

  // Check the NPM registry for the lastest version of this plugin.
  async _checkLatest () {
    try {
      const npmRegistry = new homebridgeLib.RestClient({
        host: 'registry.npmjs.org',
        name: 'npm registry'
      })
      const response = await npmRegistry.get(context.pluginName)
      if (response != null && response['dist-tags'] != null) {
        const latest = response['dist-tags'].latest
        if (latest > context.pluginVersion) {
          this.warn('latest version: %s v%s', context.pluginName, latest)
        } else {
          this.debug('latest version: %s v%s', context.pluginName, latest)
        }
      }
    } catch (error) {
      this.error(error)
    }
  }

  // ===== Handle Accessories ==================================================

  // Called by homebridge when restoring cached accessories from
  // ~/.homebridge/accessories/cachedAccessories.
  configureAccessory (accessory) {
    const name = accessory.context.name
    const className = accessory.context.className
    const id = accessory.context.id
    const context = accessory.context.context
    this.debug('%s: cached %s %s: %j', name, className, id, context)
    this._accessories[id] = accessory
    if (this._configJson != null) {
      const historyService = accessory.getService(this.Service.eve.History)
      if (historyService != null) {
        accessory.removeService(historyService)
      }
      this.emit('accessoryRestored', className, context)
    }
  }

  // Return accessory for params.id.
  _getAccessory (params) {
    return this._accessories[params.id]
  }

  // Create accessory.
  _createAccessory (params) {
    const name = params.name
    const className = params.className
    const id = params.id
    const category = params.category
    if (this._accessories[id] != null) {
      throw new RangeError(`${id}: duplicate accessory id`)
    }
    this.debug('%s: create %s %s', name, className, id)
    const uuid = this._homebridge.hap.uuid.generate(params.id).toUpperCase()
    const accessory = new context.PlatformAccessory(name, uuid, category)
    this._accessories[id] = accessory
    accessory.displayName = name
    accessory.context = {
      name: name,
      className: className,
      id: id,
      context: {}
    }
    if (Object.keys(this._accessories).length >= context.maxAccessories) {
      this.error('%s: not exposed to HomeKit - too many accessories', name)
    } else {
      this._homebridge.registerPlatformAccessories(
        context.pluginName, context.platformName, [accessory]
      )
    }
    return accessory
  }

  // Remove accessory.
  _removeAccessory (accessory) {
    const name = accessory.context.name
    const className = accessory.context.className
    const id = accessory.context.id
    const context = accessory.context.context
    this.debug('%s: delete %s %s', name, className, id)
    this.emit('accessoryRemoved', className, context)
    this._homebridge.unregisterPlatformAccessories(
      context.pluginName, context.platformName, [accessory]
    )
    delete this._accessories[id]
  }

  // Cleanup cached accessories.
  _cleanup () {
    const n = Object.keys(this._accessories).length
    if (n > 0) {
      this.log('cleaning up %d cached accessories', n)
      for (const id in this._accessories) {
        this._removeAccessory(this._accessories[id])
      }
    }
  }

  // ===== UPnP Device Discovery ===============================================

  // Initialise UPnP discovery.
  _upnpConfig (config) {
    this._upnp = {
      // devices: {},
      host: (config.address || '239.255.255.250') + ':' + (config.port || 1900),
      timeout: config.searchTimeout || 5
      // listenerRestartWaitTime: config.listenerRestartWaitTime || 5
    }
    this._upnpMonitor = new homebridgeLib.UpnpMonitor(this._upnp)
    this._upnpMonitor.on('listening', (host) => {
      this.debug('upnp: listening on %s', host)
    })
    this._upnpMonitor.on('searching', (host) => {
      this.debug('upnp: searching on %s', host)
    })
    this._upnpMonitor.on('searchDone', () => {
      this.debug('upnp: search done')
    })
    this._upnpMonitor.on('error', (error) => {
      this.error('upnp: error')
      this.error(error)
    })
    this._upnpMonitor.on('deviceAlive', (address, obj, message) => {
      this.emit('upnpDeviceAlive', address, obj)
    })
    this._upnpMonitor.on('deviceFound', (address, obj, message) => {
      this.emit('upnpDeviceFound', address, obj)
    })
  }

  // ===== Logging =============================================================

  // Do the heavy lifting for debug(), error(), fatal(), log(), and warn(),
  // taking into account errors vs exceptions.
  _message (level, namePrefix, format, ...args) {
    let message

    if (format == null) {
      message = ''
    } else if (format instanceof Error) {
      switch (format.constructor.name) {
        case 'AssertionError':
        case 'RangeError':
        case 'ReferenceError':
        case 'SyntaxError':
        case 'TypeError':
          // Error: print stack trace.
          message = format.stack
          break
        default:
          // Exception: print message only.
          message = format.message
          break
      }
    } else if (typeof (format) === 'string') {
      message = util.format(format, ...args)
    } else if (typeof (format.toString) === 'function') {
      // Not a string, but convertable into a string.
      message = util.format(format.toString(), ...args)
    } else {
      throw new TypeError('format: not a string or Error object')
    }
    switch (level) {
      case 'debug':
        message = namePrefix + message
        this._log.debug(message)
        break
      case 'log':
        message = namePrefix + message
        this._log(message)
        break
      case 'warning':
        message = namePrefix + 'warning: ' + message
        this._log.warn(message)
        break
      default:
        message = namePrefix + level + ': ' + message
        this._log.error(message)
        break
    }
  }
}
