// homebridge-lib/lib/Platform.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2025 Erik Baauw. All rights reserved.

import { once } from 'node:events'
import { writeFile, unlink } from 'node:fs/promises'
import { Server, STATUS_CODES } from 'node:http'
import { createRequire } from 'node:module'
import { format, promisify } from 'node:util'
import zlib from 'node:zlib'

import { HttpClient } from 'hb-lib-tools/HttpClient'
import { SystemInfo } from 'hb-lib-tools/SystemInfo'
import { UpnpClient } from 'hb-lib-tools/UpnpClient'

import { Delegate } from 'homebridge-lib/Delegate'
import { EveHomeKitTypes } from 'homebridge-lib/EveHomeKitTypes'
import { MyHomeKitTypes } from 'homebridge-lib/MyHomeKitTypes'
import { semver } from 'homebridge-lib/semver'

import { formatError, recommendedNodeVersion } from 'homebridge-lib'

const require = createRequire(import.meta.url)
const libPackageJson = require('../package.json')

const uuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/
const gzip = promisify(zlib.gzip)

const context = {
  libName: libPackageJson.name,
  libVersion: libPackageJson.version,
  nodeVersion: process.version.slice(1),
  recommendedNodeVersion: recommendedNodeVersion(libPackageJson),
  // recommendedHomebridgeVersion:
  //   semver.minVersion(libPackageJson.engines.homebridge).toString(),
  saveInterval: 3600,
  checkInterval: 7 * 24 * 3600,
  driftDebugThreshold: 250,
  driftWarningThreshold: 2500
}

/** Homebridge dynamic platform plugin.
  * <br>See {@link Platform}.
  * @name Platform
  * @type {Class}
  * @memberof module:homebridge-lib
  */

/** Homebridge dynamic platform plugin.
  *
  * `Platform` provides the following features to a platform plugin:
  * - Check the versions of NodeJS and Homebridge;
  * - Check whether a newer version of the plugin has been published to the NPM
  * registry;
  * - Handle the administration of the HomeKit accessories exposed by
  * the plugin through Homebridge;
  * - Persist HomeKit accessories across Homebridge restarts;
  * - Support for device polling by providing a heartbeat;
  * - Support for UPnP device discovery;
  * - Support dynamic configuration through the Homebridge UI.
  * @abstract
  * @extends Delegate
  */
class Platform extends Delegate {
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
      context.recommendedHomebridgeVersion =
        semver.minVersion(libPackageJson.engines.homebridge).toString()

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
      const eve = new EveHomeKitTypes(homebridge)
      const my = new MyHomeKitTypes(homebridge)

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
    context[Platform.name] = { packageJson, platformName }
    // console.log(
    //   '%s v%s, node v%s, homebridge v%s, %s v%s',
    //   packageJson.name, packageJson.version, context.nodeVersion,
    //   context.homebridgeVersion, context.libName, context.libVersion
    // )
    homebridge.registerPlatform(
      packageJson.name, platformName, Platform, true
    )
  }

  get Accessory () { return context.Accessory }

  get Services () { return context.Services }

  get Characteristic () { return context.Characteristic }

  get Characteristics () { return context.Characteristics }

  /** Content of the plugin's package.json file.
    * @type {object}
    * @readonly
    */
  get packageJson () { return this._myContext.packageJson }

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
    this._myContext = context[this.constructor.name]
    this._platformName = this._myContext.platformName
    this._pluginName = this._myContext.packageJson.name
    this._pluginVersion = this._myContext.packageJson.version

    this._accessories = {}
    this._accessoryDelegates = {}

    if (this._myContext.platform != null) {
      this.fatal(
        'config.json: duplicate entry for %s platform',
        this._myContext.platformName
      )
    }
    this._myContext.platform = this
    this._identify()

    this._homebridge
      .on('didFinishLaunching', this._main.bind(this))
      .on('shutdown', this._shutdown.bind(this))
    process.on('exit', this._exit.bind(this))
  }

  // ===== Main ================================================================

  // Main platform function.
  // Called by homebridge after restoring accessories from cache.
  async _main () {
    /** System information.
      * @type {SystemInfo}
      * @readonly
      */
    this.systemInfo = new SystemInfo()
    this.systemInfo
      .on('error', (error) => { this.warn(error) })
      .on('exec', (command) => { this.debug('exec: %s', command) })
      .on('readFile', (filename) => { this.debug('read file: %s', filename) })
    await this.systemInfo.init()
    this.log('hardware: %s', this.systemInfo.hwInfo.prettyName)
    this.log('os: %s', this.systemInfo.osInfo.prettyName)
    this._heartbeatStart = new Date()
    setTimeout(() => { this._beat(-1) }, 1000)
    this.on('exit', () => { this._flushCachedAccessories() })

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
    if (typeof this.onUiRequest === 'function') {
      try {
        await this._createUiServer()
      } catch (error) { this.error(error) }
    }
    await once(this, 'initialised')
    this._flushCachedAccessories()
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

  /** Create a debug dump file.
    *
    * The dump file is a gzipped json file containing
    * - The hardware and software environment of the server running Homebridge;
    * - The versions of the plugin and of homebridge-lib;
    * - The contents of config.json;
    * - Any plugin-specific information.
    *
    * The file is created in the Homebridge user directory, and named after
    * the plugin.
    * @param {*} dumpInfo - Plugin-specific information.
    */
  async createDumpFile (dumpInfo = {}) {
    const result = {
      hardware: this.systemInfo.hwInfo.prettyName,
      os: this.systemInfo.osInfo.prettyName,
      node: context.nodeVersion,
      homebridge: context.homebridgeVersion
    }
    result[this._pluginName] = this._pluginVersion
    result[context.libName] = context.libVersion
    result.configJson = this._configJson
    const filename = this._homebridge.user.storagePath() + '/' +
      this._pluginName + '.json.gz'
    try {
      const data = await gzip(JSON.stringify(Object.assign(result, dumpInfo)))
      await writeFile(filename, data)
      this.log('created debug dump file %s', filename)
    } catch (error) {
      this.error('%s: %s', filename, error)
    }
  }

  // Write `cachedAccessories` to disk.
  _flushCachedAccessories () {
    this.debug('flush cachedAccessories')
    this._homebridge.updatePlatformAccessories([])
  }

  // Called every second.
  _beat (beat) {
    beat += 1
    const drift = new Date() - this._heartbeatStart - 1000 * (beat + 1)
    if (this._shuttingDown) {
      this.debug('last heartbeat %d, drift %d', beat, drift)
      return
    }
    if (drift < -context.driftDebugThreshold || drift > context.driftDebugThreshold) {
      if (drift < -context.driftWarningThreshold || drift > context.driftWarningThreshold) {
        this.warn('heartbeat %d, drift %d', beat, drift)
      } else {
        this.debug('heartbeat %d, drift %d', beat, drift)
      }
    }
    setTimeout(() => {
      this._beat(beat)
    }, 1000 - drift)

    if (beat % context.saveInterval === 30) {
      this._flushCachedAccessories()
    }

    if (beat % context.checkInterval === 0) {
      this._checkLatest(this._pluginName, this._pluginVersion)
      // this._checkLatest(context.libName, context.libVersion)
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
    if (this._ui?.abortController != null) {
      this._ui.abortController.abort()
    }
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
    this.log(
      '%s v%s, node v%s, homebridge v%s, %s v%s',
      this._pluginName, this._pluginVersion, context.nodeVersion,
      context.homebridgeVersion, context.libName, context.libVersion
    )
    if (context.nodeVersion !== context.recommendedNodeVersion) {
      this.warn(
        'recommended version: node v%s', context.recommendedNodeVersion
      )
    }
    if (context.homebridgeVersion !== context.recommendedHomebridgeVersion) {
      this.warn(
        'recommended version: homebridge v%s',
        context.recommendedHomebridgeVersion
      )
    }
    const n = Object.keys(this._accessories).length
    if (n > 0) {
      this.log('exposing %d accessories', n)
    }
    this.debug('config.json: %j', this._configJson)
  }

  // Check the NPM registry for the latest version of this plugin.
  async _checkLatest (name, version) {
    try {
      if (this.npmRegistry == null) {
        this.npmRegistry = new HttpClient({
          https: true,
          host: 'registry.npmjs.org',
          json: true,
          maxSockets: 1
        })
        this.npmRegistry
          .on('error', (error) => {
            this.log(
              'npm registry: request %d: %s %s', error.request.id,
              error.request.method, error.request.resource
            )
            this.warn('npm registry: request %d: %s', error.request.id, error)
          })
          .on('request', (request) => {
            this.debug(
              'npm registry: request %d: %s %s', request.id,
              request.method, request.resource
            )
            this.vdebug(
              'npm registry: request %d: %s %s', request.id,
              request.method, request.url
            )
          })
          .on('response', (response) => {
            this.vdebug(
              'npm registry: request %d: response: %j', response.request.id,
              response.body
            )
            this.debug(
              'npm registry: request %d: %d %s', response.request.id,
              response.statusCode, response.statusMessage
            )
          })
      }
      const { body } = await this.npmRegistry.get(
        '/' + name + '/latest', { Accept: 'application/json' })
      if (body?.version != null) {
        if (body.version !== version) {
          this.warn('latest version: %s v%s', name, body.version)
        } else {
          this.debug('latest version: %s v%s', name, body.version)
        }
      }
    } catch (error) {
      if (error.request == null) {
        this.error(error)
      }
    }
  }

  // ===== Handle Accessories ==================================================

  /** Configure an accessory, after it has been restored from peristent
    * storage.
    *
    * Called by homebridge when restoring peristed accessories, typically from
    * `~/.homebridge/accessories/cachedAccessories`.
    * @method
    * @param {!PlatformAccessory} accessory - The restored Homebridge
    * [PlatformAccessory](https://github.com/nfarina/homebridge/blob/master/lib/platformAccessory.js).
    */
  configureAccessory (accessory) {
    const className = accessory.context.className
    const version = accessory.context.version
    const id = accessory.context.id
    const name = accessory.context.name
    const context = accessory.context.context
    this.debug('%s: cached %s v%s %s', name, className, version, id)
    this.vdebug('%s: cached %s v%s %s: %j', name, className, version, id, context)
    this._accessories[id] = accessory
    // Fix homebridge overwrites firmware with package version.
    const uuid = this.Services.hap.AccessoryInformation.UUID
    if (accessory.context[uuid].firmware != null) {
      accessory.getService(this.Services.hap.AccessoryInformation)
        .getCharacteristic(this.Characteristics.hap.FirmwareRevision)
        .updateValue(accessory.context[uuid].firmware)
    }
    /** Emitted when Homebridge has restored an accessory from peristed
      * storage.
      *
      * On receiving this event, the plugin should restore the accessory
      * delegate.
      * @event Platform#accessoryRestored
      * @param {!string} className - The name of the
      * {@link AccessoryDelegate#className class} of the accessory delegate.
      * @param {!string} version - The version of the plugin that stored the
      * cached accessory.
      * @param {!string} id - The accessory ID.
      * @param {!string} name - The accessory name.
      * @param {object} context - The accessory
      * {@link AccessoryDelegate#context context}.
      */
    this.emit('accessoryRestored', className, version, id, name, context)
  }

  // Get or create accessory.
  _getAccessory (delegate, params) {
    const className = delegate.constructor.name
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
        } catch (error) {
          try {
            // Make sure the accessory won't be persisted, since it will fail
            // to be exposed again on restore, causing `configureAccessory()`
            // not to be called.
            this._homebridge.unregisterPlatformAccessories(
              this._pluginName, this._platformName, [accessory]
            )
          } catch (error) {}
          /** Emitted when associated accessory could not be exposed.
            * @event AccessoryDelegate#exposeError
            * @param {Error} error - The error trying to expose the accessory.
            */
          delegate.emit('exposeError', error)
        }
      })
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
      unlink(historyFile, (error) => {
        if (error) {
          this.warn(error)
        }
      })
    }
    this.debug('%s: remove %s %s', name, className, id)
    try {
      this._homebridge.unregisterPlatformAccessories(
        this._pluginName, this._platformName, [accessory]
      )
    } catch (error) {}
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
    this._upnpMonitor = new UpnpClient(config)
    this._upnpMonitor
      .on('error', (error) => {
        this.error('upnp: error')
        this.error(error)
      })
      .on('listening', (host) => {
        this.debug('upnp: listening on %s', host)
      })
      .on('searching', (host) => {
        this.debug('upnp: searching on %s', host)
      })
      .on('searchDone', () => {
        this.debug('upnp: search done')
      })
      .on('deviceAlive', (address, message) => {
        // this.debug('upnp: device %s is alive: %j', address, message)
        /** Emitted when a UPnP device sends an alive message.
          * @event Platform#upnpDeviceAlive
          * @param {string} address - The device's IP address.
          * @param {object} message - The contents of the alive message.
          */
        this.emit('upnpDeviceAlive', address, message)
      })
      .on('deviceFound', (address, message) => {
        // this.debug('upnp: found device %s: %j', address, message)
        /** Emitted when a UPnP device responds to a search request.
          * @event Platform#upnpDeviceFound
          * @param {string} address - The device's IP address.
          * @param {object} message - The contents of the search response message.
          */
        this.emit('upnpDeviceFound', address, message)
      })
  }

  // ===== Dynamic Configuration through Homebridge UI =========================

  /** Handler for requests from the Homebridge Plugin UI Server.
    * @function Platform#onUiRequest
    * @async
    * @abstract
    * @param {string} method - The request method.
    * @param {string} resource - The request resource.
    * @param {*} body - The request body.
    * @returns {*} - The response body.
    */

  // Create HTTP server for Homebridge Plugin UI Settings.
  async _createUiServer () {
    this._ui = {}
    this._ui.server = new Server()
    this._ui.server
      .on('listening', () => {
        this._ui.port = this._ui.server.address().port
        this.log('ui server: listening on http://127.0.0.1:%d/', this._ui.port)
        for (const id in this._accessoryDelegates) {
          this._accessoryDelegates[id].values.uiPort = this._ui.port
        }
      })
      .on('error', (error) => { this.error(error) })
      .on('close', () => {
        this.debug('ui server: closed port %d', this._ui.port)
      })
      .on('request', async (request, response) => {
        let buffer = ''
        request.on('data', (data) => { buffer += data })
        request.on('end', async () => {
          try {
            if (buffer !== '') {
              try {
                request.body = JSON.parse(buffer)
              } catch (error) {
                this.log(
                  'ui request %s: %s %s %s', ++this._ui.requestId,
                  request.method, request.url, buffer
                )
                this.warn('ui request %d: %s', this._ui.requestId, error.message)
                response.writeHead(400) // Bad Request
                response.end()
                return
              }
              this.debug(
                'ui request %s: %s %s %j', ++this._ui.requestId,
                request.method, request.url, request.body
              )
            } else {
              this.debug(
                'ui request %s: %s %s', ++this._ui.requestId,
                request.method, request.url
              )
            }
            const { status, body } =
              request.method === 'GET' && request.url === '/ping'
                ? { status: 200, body: 'pong' }
                : await this.onUiRequest(
                  request.method, request.url, request.body
                )
            this.debug(
              'ui request %d: %d %s', this._ui.requestId,
              status, STATUS_CODES[status]
            )
            if (status === 200) {
              this.vdebug('ui request %d: response: %j', this._ui.requestId, body)
              response.writeHead(status, { 'Content-Type': 'application/json' })
              response.end(JSON.stringify(body))
            } else {
              response.writeHead(status)
              response.end()
            }
          } catch (error) {
            this.warn('ui request %d: %s', this._ui.requestId, error)
            response.writeHead(500) // Internal Server Error
            response.end()
          }
        })
      })
    this._ui.abortController = new AbortController() // eslint-disable-line no-undef
    this._ui.requestId = 0
    this._ui.server.listen({
      port: 0,
      host: '127.0.0.1',
      signal: this._ui.abortController.signal
    })
    await once(this._ui.server, 'listening')
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
        lastArg = formatError(lastArg, true)
      }
      args.push(lastArg)
    }

    // Format message.
    if (args[0] == null) {
      message = ''
    } else if (typeof (args[0]) === 'string') {
      message = format(...args)
    } else {
      throw new TypeError('format: not a string or instance of Error')
    }

    // Output message using homebridge's log function.
    switch (level) {
      case 'debug':
      case 'vdebug':
      case 'vvdebug':
        if (logLevel >= { debug: 2, vdebug: 3, vvdebug: 4 }[level]) {
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

export { Platform }
