// homebridge-lib/lib/Platform.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2019 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

const fs = require('fs')
const semver = require('semver')
const util = require('util')
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
  saveInterval: 3600,
  checkInterval: 7 * 24 * 3600
}

/** Abstract superclass for a Homebridge dynamic platform plugin.
  *
  * `Platform` provides the following features to a platform plugin:
  * - Check the versions of NodeJS and Homebridge;
  * - Check whether a newer version of the plugin has been published to the NPM
  * registry;
  * - Handle the administration of the HomeKit accessories exposed by
  * the plugin through Homebridge;
  * - Persist HomeKit accessories across Homebridge restarts;
  * - Support for device polling by providing a heartbeat;
  * - Support for UPnP device discovery.
  * @abstract
  * @extends Delegate
  */
class Platform extends homebridgeLib.Delegate {
  /** Load the platform plugin.
    *
    * Called by Homebridge, through the plugin's `index.js`, when loading the
    * plugin from the plugin directory, typically `/usr/lib/node_modules`.
    * @static
    * @param {!API} homebridge - Homebridge
    * [API](https://github.com/nfarina/homebridge/blob/master/lib/api.js).
    * @param {!object} packageJson - The contents of the plugin's `package.json`.
    * @param {!string} platformName - The name of the platform plugin, as used
    * in Homebridge's `config.json`.
    * @param {!Platform} Platform - The constructor of the platform plugin.
    */
  static loadPlatform (homebridge, packageJson, platformName, Platform) {
    context.platformName = platformName
    context.pluginName = packageJson.name
    context.pluginVersion = packageJson.version
    context.homebridgeVersion = homebridge.serverVersion
    context.PlatformAccessory = homebridge.platformAccessory
    context.Accessory = { hap: homebridge.hap.Accessory }
    context.Service = { hap: homebridge.hap.Service }
    context.Characteristic = {
      hap: homebridge.hap.Characteristic,
      Formats: homebridge.hap.Characteristic.Formats,
      Perms: homebridge.hap.Characteristic.Perms,
      Units: homebridge.hap.Characteristic.Units
    }
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

  /** Create a new instance of the platform plugin.
    *
    * Called by Homebridge when initialising the plugin from `config.json`.
    * Note that only one instance of a dynamic platform plugin can be created.
    * @param {!logger} homebridge - Instance of Homebridge
    * [logger](https://github.com/nfarina/homebridge/blob/master/lib/logger.js)
    * for the plugin.
    * @param {?object} configJson - The contents of the platform object from
    * Homebridge's `config.json`, or `null` when the plugin isn't included
    * in config.json.
    * @param {!API} homebridge - Homebridge
    * [API](https://github.com/nfarina/homebridge/blob/master/lib/api.js).
    */
  constructor (log, configJson, homebridge) {
    super()
    this._log = log
    this._configJson = configJson
    this._homebridge = homebridge
    this._accessories = {}
    this._accessoryDelegates = {}

    process.on('exit', this._exit.bind(this))
    this._identify()
    if (configJson == null) {
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
    this._heartbeatStart = new Date()
    setTimeout(() => { this._beat(-1) }, 1000)
    if (this.listenerCount('upnpDeviceAlive') > 0) {
      this._upnpConfig(this._configJson.upnp || {})
      this._upnpMonitor.listen()
    }
    if (this.listenerCount('upnpDeviceFound') > 0) {
      this._upnpConfig(this._configJson.upnp || {})
      this._upnpMonitor.search()
    } else {
      this._upnpSearchInterval = 0
    }
  }

  // Called every second.
  _beat (beat) {
    beat += 1
    const drift = new Date() - this._heartbeatStart - 1000 * (beat + 1)
    if (drift < -250 || drift > 250) {
      this.warn('heartbeat %d, drift %d', beat, drift)
    }
    if (this._shuttingDown) {
      this.debug('last heartbeat %d, drift %d', beat, drift)
      return
    }
    setTimeout(() => {
      this._beat(beat)
    }, 1000 - drift)
    /** Emitted every second.
      * @event Platform#heartbeat
      * @param {number} beat - The sequence number of this heartbeat.
      */
    this.emit('heartbeat', beat)
    if (beat % context.saveInterval === 30) {
      // Persist dynamic platform accessories to cachedAccessories
      this.debug('persisting accessories')
      this._homebridge.updatePlatformAccessories()
    }
    if (beat % context.checkInterval === 0) {
      this._checkLatest()
    }
    if (beat % this._upnpSearchInterval === 0) {
      this._upnpMonitor.search()
    }
    for (const id in this._accessoryDelegates) {
      if (this._accessoryDelegates[id].alive) {
        /** Emitted every second.
          * @event AccessoryDelegate#heartbeat
          * @param {number} beat - The sequence number of this heartbeat.
          */
        this._accessoryDelegates[id].emit('heartbeat', beat)
      }
    }
  }

  // Called by homebridge when shutting down.
  _shutdown () {
    if (this._shuttingDown) {
      return
    }
    this._shuttingDown = true
    this.removeAllListeners('upnpDeviceAlive')
    this.removeAllListeners('upnpDeviceFound')
    for (const id in this._accessoryDelegates) {
      /** Emitted when Homebridge is shutting down.
        *
        * On receiving this event, the plugin should cleanup (close connections,
        * flush peristent storage, ...).
        * @event AccessoryDelegate#shutdown
        */
      this._accessoryDelegates[id].emit('shutdown')
    }
    /** Emitted when Homebridge is shutting down.
      *
      * On receiving this event, the plugin should cleanup (close connections,
      * flush peristent storage, ...).
      * @event Platform#shutdown
      */
    this.emit('shutdown')
  }

  // Called by NodeJS when process is exiting.
  _exit () {
    /** Emitted when Homebridge is exiting.
      *
      * Note: asynchronous calls made when handling this event will not be executed.
      * @event Platform#exit
      */
    this.emit('exit')
  }

  // Issue an identity message.
  _identify () {
    const nodeVersion = Platform._minVersion(context.recommendedNodeVersion)
    const homebridgeVersion = Platform._minVersion(
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
      this.log('exposing %d accessories', n)
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
      const response = await npmRegistry.get('/' + context.pluginName)
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

  /** Configure an accessory, after it has been restored from peristent
    * storage.
    *
    * Called by homebridge when restoring peristed accessories, typically from
    * `~/.homebridge/accessories/cachedAccessories`.
    * @param {!PlatformAccessory} accessory - The restored Homebridge
    * [PlatformAccessory](https://github.com/nfarina/homebridge/blob/master/lib/platformAccessory.js).
    */
  configureAccessory (accessory) {
    const className = accessory.context.className
    const id = accessory.context.id
    const name = accessory.context.name
    const context = accessory.context.context
    this.debug('%s: cached %s %s: %j', name, className, id, context)
    this._accessories[id] = accessory
    /** Emitted when Homebridge has restored an accessory from peristed
      * storage.
      *
      * On receiving this event, the plugin should restore the accessory
      * delegate.
      * @event Platform#accessoryRestored
      * @param {!string} className - The name of the
      * {@link AccessoryDelegate#className class} of the accessory delegate.
      * @param {object} context - The accessory
      * {@link AccessoryDelegate#context context}.
      */
    this.emit('accessoryRestored', className, context)
    if (this._accessoryDelegates[id] == null) {
      setImmediate(() => {
        this._removeAccessory(accessory)
      })
    }
  }

  // Get or create accessory.
  _getAccessory (delegate, params) {
    const className = delegate.className
    const id = params.id
    let accessory = this._accessories[id]
    if (accessory == null) {
      const name = params.name
      const category = params.category
      this.debug('%s: create %s %s', name, className, id)
      const uuid = this._homebridge.hap.uuid.generate(params.id).toUpperCase()
      accessory = new context.PlatformAccessory(name, uuid, category)
      this._accessories[id] = accessory
      accessory.displayName = name
      accessory.context = {
        className: className,
        id: id,
        name: name,
        context: {}
      }
      try {
        this._homebridge.registerPlatformAccessories(
          context.pluginName, context.platformName, [accessory]
        )
      } catch (error) {
        this.error(error)
      }
      delegate.setAlive()
    } else {
      // Allow for plugin to change delegate class
      accessory.context.className = className
    }
    this._accessoryDelegates[id] = delegate
    return accessory
  }

  // Remove accessory.
  _removeAccessory (accessory) {
    const className = accessory.context.className
    const id = accessory.context.id
    const name = accessory.context.name
    const context = accessory.context.context
    const historyFile = accessory.context.historyFile
    if (historyFile) {
      this.debug('remove history file %s', historyFile)
      fs.unlink(historyFile, (error) => {
        if (error) {
          this.error(error)
        }
      })
    }
    this.debug('%s: remove %s %s', name, className, id)
    this._homebridge.unregisterPlatformAccessories(
      context.pluginName, context.platformName, [accessory]
    )
    delete this._accessoryDelegates[id]
    delete this._accessories[id]
  }

  // ===== UPnP Device Discovery ===============================================

  // Initialise UPnP discovery.
  _upnpConfig (config) {
    if (this._upnpMonitor != null) {
      return
    }
    const options = {
      host: (config.address || '239.255.255.250') + ':' + (config.port || 1900),
      timeout: config.searchTimeout || 5
    }
    this._upnpSearchInterval = config.searchInterval
    this._upnpMonitor = new homebridgeLib.UpnpClient(options)
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
      this.debug('upnp: device %s is alive: %j', address, obj)
      /** Emitted when a UPnP device sends an alive message.
        * @event Platform#upnpDeviceAlive
        * @param {string} address - The device's IP address.
        * @param {object} obj - The contents of the alive message.
        */
      this.emit('upnpDeviceAlive', address, obj)
    })
    this._upnpMonitor.on('deviceFound', (address, obj, message) => {
      this.debug('upnp: found device %s: %j', address, obj)
      /** Emitted when a UPnP device responds to a search request.
        * @event Platform#upnpDeviceFound
        * @param {string} address - The device's IP address.
        * @param {object} obj - The contents of the search response message.
        */
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
      throw new TypeError('format: not a string or instance of Error')
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

module.exports = Platform
