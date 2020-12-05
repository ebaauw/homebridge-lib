// homebridge-lib/lib/Platform.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2020 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

const events = require('events')
const fs = require('fs')
const semver = require('semver')
const util = require('util')
const libPackageJson = require('../package.json')

const uuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/

const context = {
  libName: libPackageJson.name,
  libVersion: libPackageJson.version,
  nodeVersion: process.version.slice(1),
  recommendedNodeVersion:
    semver.minVersion(libPackageJson.engines.node).toString(),
  recommendedHomebridgeVersion:
    semver.minVersion(libPackageJson.engines.homebridge).toString(),
  saveInterval: 3600,
  checkInterval: 7 * 24 * 3600
}

const globalKey = context.libName // + '@' + context.libVersion

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
    if (context.homebridge == null) {
      context.homebridge = homebridge
      context.homebridgeVersion = homebridge.serverVersion
      context.PlatformAccessory = homebridge.platformAccessory
      const hap = {
        Services: {},
        Characteristics: {}
      }
      Object.keys(homebridge.hap.Service).sort().filter((key) => {
        return uuid.test(homebridge.hap.Service[key].UUID)
      }).forEach((key) => {
        hap.Services[key] = homebridge.hap.Service[key]
      })
      Object.keys(homebridge.hap.Characteristic).sort().filter((key) => {
        return uuid.test(homebridge.hap.Characteristic[key].UUID)
      }).forEach((key) => {
        hap.Characteristics[key] = homebridge.hap.Characteristic[key]
      })
      const eve = new homebridgeLib.EveHomeKitTypes(homebridge)
      const my = new homebridgeLib.MyHomeKitTypes(homebridge)

      context.Accessory = Object.freeze({
        Categories: Object.freeze(Object.assign({}, homebridge.hap.Categories))
      })
      context.Services = Object.freeze({
        hap: Object.freeze(hap.Services),
        eve: Object.freeze(eve.Services),
        my: Object.freeze(my.Services)
      })
      context.Characteristic = Object.freeze({
        Access: Object.freeze(Object.assign({}, homebridge.hap.Access)),
        Formats: Object.freeze(Object.assign({}, homebridge.hap.Formats)),
        Perms: Object.freeze(Object.assign({}, homebridge.hap.Perms)),
        Units: Object.freeze(Object.assign({}, homebridge.hap.Units))
      })
      context.Characteristics = Object.freeze({
        hap: Object.freeze(hap.Characteristics),
        eve: Object.freeze(eve.Characteristics),
        my: Object.freeze(my.Characteristics)
      })
    }
    if (global[globalKey] == null) {
      global[globalKey] = {
        Platform: {
          platformName: context.libName,
          packageJson: libPackageJson,
          UpnpClient: homebridgeLib.UpnpClient
        }
      }
      homebridge.registerPlatform(
        // libPackageJson.name, 'Lib', homebridgeLib.Platform, false
        packageJson.name, 'Lib', homebridgeLib.Platform, false
      )
    // } else {
      // TODO: check compatible homebridge-lib version.
    }
    global[globalKey][Platform.name] = {
      platformName: platformName,
      packageJson: packageJson
    }
    homebridge.registerPlatform(
      packageJson.name, platformName, Platform, true
    )
  }

  get Accessory () { return context.Accessory }

  get Services () { return context.Services }

  get Characteristic () { return context.Characteristic }

  get Characteristics () { return context.Characteristics }

  /** Create a new instance of the platform plugin.
    *
    * Called by Homebridge when initialising the plugin from `config.json`.
    * Note that only one instance of a dynamic platform plugin can be created.
    * @param {!logger} log - Instance of Homebridge
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
    const myContext = global[globalKey][this.className]
    this._platformName = myContext.platformName
    this._pluginName = myContext.packageJson.name
    this._pluginVersion = myContext.packageJson.version
    if (myContext.packageJson.name === context.libName) {
      this._isHomebridgeLib = true
      myContext.heartbeat = this
      // Delay start of Homebridge's HAP server until all plugins have
      // initialised.
      this.accessories = (f) => {
        this.on('initialised', () => { f([]) })
      }
      // this.debug('Categories: %j', this.Accessory.Categories)
      // for (const type of ['Access', 'Formats', 'Perms', 'Units']) {
      //   this.debug('%s: %j', type, this.Characteristic[type])
      // }
      // for (const module of ['hap', 'eve', 'my']) {
      //   this.debug('Services.%s: %j', module, Object.keys(this.Services[module]))
      //   this.debug('Characteristics.%s: %j', module, Object.keys(this.Characteristics[module]))
      // }
    } else {
      /** Configure an accessory, after it has been restored from peristent
        * storage.
        *
        * Called by homebridge when restoring peristed accessories, typically from
        * `~/.homebridge/accessories/cachedAccessories`.
        * @method
        * @param {!PlatformAccessory} accessory - The restored Homebridge
        * [PlatformAccessory](https://github.com/nfarina/homebridge/blob/master/lib/platformAccessory.js).
        */
      this.configureAccessory = this._configureAccessory
    }
    this._accessories = {}
    this._accessoryDelegates = {}

    if (myContext.platform != null) {
      this.fatal(
        'config.json: duplicate entry for %s platform', myContext.platformName
      )
    }
    myContext.platform = this
    if (global[globalKey].Platform == null) {
      this.fatal('%s platform not registered', context.libName)
    }
    this._identify()

    this._homebridge.on('didFinishLaunching', this._main.bind(this))
    this._homebridge.on('shutdown', this._shutdown.bind(this))
    process.on('exit', this._exit.bind(this))
  }

  // ===== Main ================================================================

  // Main platform function.
  // Called by homebridge after restoring accessories from cache.
  async _main () {
    if (this._isHomebridgeLib || global[globalKey].Platform.heartbeat == null) {
      process.on('unhandledRejection', (error) => { this.error(error) })
      global[globalKey].Platform.heartbeat = this
      this.heartbeatClients = Object.keys(global[globalKey]).filter((key) => {
        return global[globalKey][key].platform != null
      })
      this.debug('starting heartbeat for %j', this.heartbeatClients)
      this._heartbeatStart = new Date()
      setTimeout(() => { this._beat(-1) }, 1000)
      this.on('exit', () => {
        this.debug('flush cachedAccessories')
        this._homebridge.updatePlatformAccessories()
        this.log('goodbye')
      })
    }
    if (this._isHomebridgeLib) {
      const jobs = []
      for (const plugin in global[globalKey]) {
        const platform = global[globalKey][plugin].platform
        if (
          platform != null && platform !== this &&
          Object.keys(platform._accessories).length === 0
        ) {
          this.warn('waiting on %s', plugin)
          jobs.push(events.once(platform, 'initialised'))
        }
      }
      for (const job of jobs) {
        await job
      }
      this.emit('initialised')
    }
    const n = Object.keys(this._accessories).length
    if (n > 0) {
      this.log('restored %d accessories from cache', n)
    }
    if (this.listenerCount('upnpDeviceAlive') > 0) {
      this._upnpMonitor.listen()
    }
    if (this.listenerCount('upnpDeviceFound') > 0) {
      this._upnpMonitor.search()
    }
    await events.once(this, 'initialised')
    for (const id in this._accessories) {
      if (this._accessoryDelegates[id] == null) {
        const accessory = this._accessories[id]
        this.log(
          '%s: remove stale %s%s accessory %s', accessory.context.name,
          accessory.context.className,
          accessory.context.version == null
            ? ''
            : ' v' + accessory.context.version,
          accessory.context.id
        )
        this._removeAccessory(accessory)
      }
    }
  }

  // Called every second.
  _beat (beat) {
    beat += 1
    const drift = new Date() - this._heartbeatStart - 1000 * (beat + 1)
    if (this._shuttingDown) {
      this.debug('last heartbeat %d, drift %d', beat, drift)
      return
    }
    if (drift < -250 || drift > 250) {
      this.warn('heartbeat %d, drift %d', beat, drift)
    }
    setTimeout(() => {
      this._beat(beat)
    }, 1000 - drift)

    if (beat % context.saveInterval === 30) {
      // Persist dynamic platform accessories to cachedAccessories
      this.debug('flush cachedAccessories')
      this._homebridge.updatePlatformAccessories()
    }

    for (const plugin of this.heartbeatClients) {
      global[globalKey][plugin].platform._heartbeat(beat)
    }
  }

  _heartbeat (beat) {
    if (beat % context.checkInterval === 0) {
      this._checkLatest()
    }
    /** Emitted every second.
      * @event Platform#heartbeat
      * @param {number} beat - The sequence number of this heartbeat.
      */
    this.emit('heartbeat', beat)
    for (const id in this._accessoryDelegates) {
      if (this._accessoryDelegates[id].heartbeatEnabled) {
        /** Emitted every second, when `heartbeatEnabled` has been set.
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
    const s = this._isHomebridgeLib
      ? ''
      : ', ' + context.libName + ' v' + context.libVersion
    this.log(
      '%s v%s, node v%s, homebridge v%s%s',
      this._pluginName, this._pluginVersion,
      context.nodeVersion, context.homebridgeVersion, s
    )
    if (context.nodeVersion !== context.recommendedNodeVersion) {
      this.warn(
        'not using recommended node v%s LTS', context.recommendedNodeVersion
      )
    }
    // if (context.homebridgeVersion !== context.recommendedHomebridgeVersion) {
    //   this.warn(
    //     'not using recommended homebridge v%s',
    //     context.recommendedHomebridgeVersion
    //   )
    // }
    const n = Object.keys(this._accessories).length
    if (n > 0) {
      this.log('exposing %d accessories', n)
    }
    this.debug('config.json: %j', this._configJson)
  }

  // Check the NPM registry for the latest version of this plugin.
  async _checkLatest () {
    try {
      if (global[globalKey].Platform.npmRegistry == null) {
        const npmRegistry = new homebridgeLib.HttpClient({
          https: true,
          host: 'registry.npmjs.org',
          json: true,
          maxSockets: 1
        })
        npmRegistry.on('request', (id, method, resource, body, url) => {
          this.debug('npm registry request %d: %s %s', id, method, resource)
          this.vdebug('npm registry request %d: %s %s', id, method, url)
        })
        npmRegistry.on('response', (id, code, message, body) => {
          this.vdebug('npm registry request %d: response: %j', id, body)
          this.debug('npm registry request %d: %d %s', id, code, message)
        })
        npmRegistry.on('error', (error, id, method, resource, body) => {
          this.warn('npm registry request %d: %s %s', id, method, resource)
          this.warn('npm registry request %d: error: %s', id, error)
        })
        global[globalKey].Platform.npmRegistry = npmRegistry
      }
      const result = await global[globalKey].Platform.npmRegistry.get(
        '/' + this._pluginName + '/latest', { Accept: 'application/json' })
      const body = result.body
      if (body != null && body.version != null) {
        if (body.version !== this._pluginVersion) {
          this.warn('latest version: %s v%s', this._pluginName, body.version)
        } else {
          this.debug('latest version: %s v%s', this._pluginName, body.version)
        }
      }
    } catch (error) {
      this.warn('cannot contact npm registy')
    }
  }

  // ===== Handle Accessories ==================================================

  _configureAccessory (accessory) {
    const className = accessory.context.className
    const version = accessory.context.version
    const id = accessory.context.id
    const name = accessory.context.name
    const context = accessory.context.context
    this.debug('%s: cached %s v%s %s: %j', name, className, version, id, context)
    this._accessories[id] = accessory
    // Fix homebridge overwrites firmware with package version.
    const uuid = this.Services.hap.AccessoryInformation.UUID
    accessory.getService(this.Services.hap.AccessoryInformation)
      .getCharacteristic(this.Characteristics.hap.FirmwareRevision)
      .updateValue(accessory.context[uuid].firmware)
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
    this.emit('accessoryRestored', className, version, id, name, context)
  }

  // Get or create accessory.
  _getAccessory (delegate, params) {
    const className = delegate.className
    const version = this._pluginVersion
    const id = params.id
    const name = params.name
    let accessory = this._accessories[id]
    if (accessory == null) {
      const category = params.category
      this.debug('%s: create %s %s', name, className, id)
      const uuid = this._homebridge.hap.uuid.generate(params.id).toUpperCase()
      accessory = new context.PlatformAccessory(name, uuid, category)
      this._accessories[id] = accessory
      accessory.displayName = name
      accessory.context = {
        className: className,
        version: version,
        id: id,
        name: name,
        logLevel: this.logLevel,
        context: {}
      }
      delegate.once('initialised', () => {
        try {
          if (params.externalAccessory) {
            this._homebridge.publishExternalAccessories(
              this._pluginName, [accessory]
            )
          } else {
            this._homebridge.registerPlatformAccessories(
              this._pluginName, this._platformName, [accessory]
            )
          }
          if (delegate._primaryService != null) {
            accessory._associatedHAPAccessory
              .setPrimaryService(delegate._primaryService)
          }
        } catch (error) {
          this.error(error)
        }
      })
    } else {
      // Allow for plugin to change delegate class, version, and name.
      accessory.context.className = className
      accessory.context.version = version
      accessory.context.name = name
      if (accessory.context.logLevel == null) {
        accessory.context.logLevel = this.logLevel
      }
    }
    this._accessoryDelegates[id] = delegate
    return accessory
  }

  // Remove accessory.
  _removeAccessory (accessory) {
    const className = accessory.context.className
    const id = accessory.context.id
    const name = accessory.context.name
    // const context = accessory.context.context
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
      this._pluginName, this._platformName, [accessory]
    )
    delete this._accessoryDelegates[id]
    delete this._accessories[id]
  }

  // ===== UPnP Device Discovery ===============================================

  /** Configure UPnP discovery.
    *
    * @param {!object} config - ...
    * @param {?string} config.class - Filter on UPnP device class.
    * Default `upnp:rootdevice`.  Use `ssdp:all` for all device classes.
    * @param {?string} config.host - UPnP address and port.
    * Default: `239.255.255.250:1900`.
    * @param {function} config.filter - Filter on UPnP message content.
    * The function takes the message as argument and returns a boolean.
    * Default: `(message) => { return true }`, return all messages.
    * @param {integer} config.timeout - Timeout (in seconds) for UPnP search.
    * Default: `5`.
    */
  upnpConfig (config) {
    if (this._upnpMonitor != null) {
      throw new SyntaxError('upnpConfig(): already called')
    }
    this._upnpMonitor = new global[globalKey].Platform.UpnpClient(config)
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
    this._upnpMonitor.on('deviceAlive', (address, message) => {
      // this.debug('upnp: device %s is alive: %j', address, message)
      /** Emitted when a UPnP device sends an alive message.
        * @event Platform#upnpDeviceAlive
        * @param {string} address - The device's IP address.
        * @param {object} message - The contents of the alive message.
        */
      this.emit('upnpDeviceAlive', address, message)
    })
    this._upnpMonitor.on('deviceFound', (address, message) => {
      // this.debug('upnp: found device %s: %j', address, message)
      /** Emitted when a UPnP device responds to a search request.
        * @event Platform#upnpDeviceFound
        * @param {string} address - The device's IP address.
        * @param {object} message - The contents of the search response message.
        */
      this.emit('upnpDeviceFound', address, message)
    })
  }

  // ===== Logging =============================================================

  // Do the heavy lifting for debug(), error(), fatal(), log(), and warn(),
  // taking into account errors vs exceptions.
  _message (level, logLevel, namePrefix, ...args) {
    let message

    // If last argument is Error convert it to string.
    if (args.length > 0) {
      let lastArg = args.pop()
      if (lastArg instanceof Error) {
        lastArg = homebridgeLib.CommandLineTool.formatError(lastArg)
      }
      args.push(lastArg)
    }

    // Format message.
    if (args[0] == null) {
      message = ''
    } else if (typeof (args[0]) === 'string') {
      message = util.format(...args)
    } else {
      throw new TypeError('format: not a string or instance of Error')
    }

    // Output message using homebridge's log function.
    switch (level) {
      case 'vdebug':
        if (logLevel >= 3) {
          message = namePrefix + message
          this._log.debug(message)
        }
        break
      case 'debug':
        if (logLevel >= 2) {
          message = namePrefix + message
          this._log.debug(message)
        }
        break
      case 'log':
        if (logLevel >= 1) {
          message = namePrefix + message
          this._log(message)
        }
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
