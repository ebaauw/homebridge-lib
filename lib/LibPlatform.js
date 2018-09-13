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

const EveHomeKitTypes = require('./EveHomeKitTypes')
const LibObject = require('./LibObject')
const MyHomeKitTypes = require('./MyHomeKitTypes')
const RestClient = require('./RestClient')
const UpnpMonitor = require('./UpnpMonitor')

const packageJson = require('../package.json')

const context = {
  platformName: '',
  pluginName: '',
  pluginVersion: '',
  nodeVersion: process.version,
  recommendedNodeVersion: packageJson.engines.node,
  homebridgeVersion: '',
  recommendedHomebridgeVersion: packageJson.engines.homebridge,
  maxAccessories: 99,
  maxServices: 99
}

// Abstract superclass for homebridge platform plug-in.
module.exports = class LibPlatform extends LibObject {
  // Link this module to homebridge.
  // Called by homebridge, through index.js, when loading the plugin from the
  // plugin directory, typically /usr/lib/node_modules.
  static loadPlatform (homebridge, packageJson, platformName, Platform) {
    context.platformName = platformName
    context.pluginName = packageJson.name
    context.pluginVersion = packageJson.version
    context.homebridgeVersion = homebridge.serverVersion
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

    process.on('exit', () => { this.log('exit') })
    this._homebridge.on('shutdown', this.onExit.bind(this))
    process.on('uncaughtException', (error) => {
      this.error('uncaught exception')
      this.fatal(error)
    })

    if (configJson == null) {
      this._homebridge.on('didFinishLaunching', this._cleanup.bind(this))
      return
    }
    if (context.initialised) {
      this.fatal(
        'config.json: duplicate entry for %s platform', context.platformName
      )
    }
    context.initialised = true
    this._eve = new EveHomeKitTypes(homebridge)
    this._my = new MyHomeKitTypes(homebridge)
    this._HistoryService = fakegatoHistory(homebridge)
    this._identify()
    this._upnpConfig(configJson.upnp || {})
    this._homebridge.on('didFinishLaunching', this._main.bind(this))
  }

  // Called when homebridge is about to exit.
  onExit () {
    this.log('homebridge exiting')
  }

  // ===== Main ================================================================

  // Main platform function.
  // Called by homebridge after restoring accessories from cache.
  _main () {
    const n = Object.keys(this._accessories).length
    if (n > 0) {
      this.log('restored %d accessories from cache', n)
    }
    if (this.listenerCount('heartbeat') > 0) {
      let beat = -1
      setInterval(() => {
        beat += 1
        this.emit('heartbeat', beat)
      }, 1000)
    }
    this._upnpConfig(this._configJson.upnp || {})
    if (this.listenerCount('upnpDeviceAlive') > 0) {
      this._upnpMonitor.listen()
    }
    if (this.listenerCount('upnpDeviceFound') > 0) {
      this._upnpMonitor.search()
    }
  }

  // Issue an identity message.
  async _identify () {
    const nodeVersion = LibPlatform._minVersion(context.recommendedNodeVersion)
    const homebridgeVersion = LibPlatform._minVersion(
      context.recommendedHomebridgeVersion
    )
    this.log(
      '%s v%s, node %s, homebridge v%s',
      context.pluginName, context.pluginVersion,
      context.nodeVersion, context.homebridgeVersion
    )
    this.debug('%s v%s', packageJson.name, packageJson.version)
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
    await this._checkLatest()
  }

  async _checkLatest () {
    const npmRegistry = new RestClient({
      host: 'registry.npmjs.org',
      name: 'npm registry'
    })
    return npmRegistry.get(context.pluginName).then((response) => {
      this.debug(
        'latest version: %s v%s', context.pluginName,
        response['dist-tags'].latest
      )
      if (
        response && response['dist-tags'] &&
        response['dist-tags'].latest !== context.pluginVersion
      ) {
        this.warn(
          'not using latest version: %s v%s', context.pluginName,
          response['dist-tags'].latest
        )
      }
    }).catch((err) => {
      this.error(err)
    })
  }

  // ===== Handle Accessories ==================================================

  // Called by homebridge when restoring cached accessories from
  // ~/.homebridge/accessories/cachedAccessories.
  configureAccessory (accessory) {
    this.debug('%s: %j', accessory.context.name, accessory.context)
    this._accessories[accessory.context.id] = accessory
    if (this._configJson != null) {
      const historyService = accessory.getService(this.eve.Service.History)
      if (historyService != null) {
        accessory.removeService(historyService)
      }
      this.emit(
        'accessoryRestored', accessory.context.className,
        accessory.context.id, accessory.context.context
      )
    }
  }

  // Return accessory for params.id.
  _getAccessory (params) {
    return this._accessories[params.id]
  }

  // Add accessory to platform.
  _registerAccessory (params, accessory) {
    if (!this._accessories[params.id]) {
      if (
        Object.keys(this._accessories).length >= context.maxAccessories
      ) {
        this.error('too many accessories, ignoring %s', params.name)
        return undefined
      }
      this._accessories[params.id] = accessory
      this._homebridge.registerPlatformAccessories(
        context.pluginName, context.platformName, [accessory]
      )
    }
    return this._accessories[params.id]
  }

  // Remove accessory from platform.
  _unregisterAccessory (accessory) {
    this._homebridge.unregisterPlatformAccessories(
      context.pluginName, context.platformName, [accessory]
    )
    if (this._accessories[accessory.context.id]) {
      delete this._accessories[accessory.context.id]
    }
  }

  // Cleanup cached accessories.
  _cleanup () {
    const n = Object.keys(this._accessories).length
    if (n > 0) {
      this.log('cleanup %d cached accessories', n)
      let accessoryList = []
      for (const key in this._accessories) {
        this.emit(
          'accessoryCleanedUp', this._accessories[key].context.className,
          this._accessories[key].context.context
        )
        accessoryList.push(this._accessories[key])
      }
      this._homebridge.unregisterPlatformAccessories(
        context.pluginName, context.platformName, accessoryList
      )
      this._accessories = {}
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
    this._upnpMonitor = new UpnpMonitor(this, this._upnp)
    this.on('upnpListening', (host) => { this.debug('upnp: listening on %s', host) })
    this.on('upnpSearching', (host) => { this.debug('upnp: searching on %s', host) })
    this.on('upnpSearchDone', () => { this.debug('upnp: search done') })
    this.on('upnpError', (err) => {
      this.error('upnp: error')
      this.error(err)
    })
  }

  // ===== Private methods =====================================================

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
