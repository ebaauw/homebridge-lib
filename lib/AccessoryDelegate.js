// homebridge-lib/lib/AccessoryDelegate.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2022 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

const startsWithUuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/

/** Delegate of a HomeKit accessory.
  *
  * @abstract
  * @extends Delegate
  */
class AccessoryDelegate extends homebridgeLib.Delegate {
  /** Create a new instance of a HomeKit accessory delegate.
    *
    * When the corresponding HomeKit accessory was restored from persistent
    * storage, it is linked to the delegate. Otherwise a new accessory
    * will be created, using the values from `params`.
    * @param {!Platform} platform - Reference to the corresponding platform
    * plugin instance.
    * @param {!object} params - Properties of the HomeKit accessory.
    * @param {!string} params.id - The unique ID of the accessory, used to
    * derive the HomeKit accessory UUID.<br>
    * Must be unchangeable, preferably a serial number or mac address.
    * @param {!string} params.name - The accessory name.<br>
    * Also used to prefix log and error messages.
    * @param {?string} params.category - The accessory category.
    * @param {!string} params.manufacturer - The accessory manufacturer.
    * @param {!string} params.model - The accessory model.
    * @param {!string} params.firmware - The accessory firmware revision.
    * @param {?string} params.hardware - The accessory hardware revision.
    * @param {?string} params.software - The accessory software revision.
    */
  constructor (platform, params = {}) {
    if (params.name == null) {
      throw new SyntaxError('params.name: missing')
    }
    super(platform, params.name)
    if (params.id == null || typeof params.id !== 'string') {
      throw new TypeError('params.id: not a string')
    }
    if (params.id === '') {
      throw new RangeError('params.id: invalid id')
    }

    // Link or create associated PlatformAccessory.
    this._accessory = this._platform._getAccessory(this, params)

    if (params.logLevel != null) {
      this.warn('params.logLevel: deprecated')
    }
    if (params.inheritLogLevel != null) {
      this.warn('params.inheritLogLevel: deprecated')
    }
    this._context = this._accessory.context

    delete this._context.logLevel

    // Setup shortcut for property values and values of the characteristics
    // of the _Accessory Information_ service.
    this._values = {} // by key

    this._propertyDelegates = {}

    // Create delegate for AccessoryInformation service.
    this._serviceDelegates = {}
    this._accessoryInformationDelegate =
      new homebridgeLib.ServiceDelegate.AccessoryInformation(this, params)

    // Configure PlatformAccessory.
    this._accessory.on('identify', this._identify.bind(this))

    this.once('initialised', () => {
      const services = []
      for (const service of this._accessory.services) {
        const key = service.UUID +
          (service.subtype == null ? '' : '.' + service.subtype)
        if (this._serviceDelegates[key] == null) {
          if (service.UUID !== this.Services.hap.ProtocolInformation.UUID) {
            services.push(service)
          }
        } else {
          this._serviceDelegates[key].emit('initialised')
        }
      }
      for (const service of services) {
        this.debug('remove stale service %s', service.displayName)
        this._accessory.removeService(service)
      }
      const staleKeys = []
      for (const key in this._context) {
        if (this._serviceDelegates[key] == null && startsWithUuid.test(key)) {
          staleKeys.push(key)
        }
      }
      for (const key of staleKeys) {
        this.debug('remove stale context %s', key)
        delete this._context[key]
      }
    })
  }

  // Remove associated accessory from platform
  destroy () {
    this.removeAllListeners()
    this._platform._removeAccessory(this._accessory)
  }

  _linkServiceDelegate (serviceDelegate) {
    const key = serviceDelegate._key
    // this.debug('link service %s', key)
    this._serviceDelegates[key] = serviceDelegate
    return serviceDelegate
  }

  _unlinkServiceDelegate (serviceDelegate) {
    const key = serviceDelegate._key
    // this.debug('unlink service %s', key)
    delete this._serviceDelegates[key]
    delete this._context[key]
  }

  get name () {
    return super.name
  }

  set name (name) {
    super.name = name
    if (this._accessory != null) {
      this._accessory.displayName = name
    }
    if (this._accessoryInformationDelegate != null) {
      this._accessoryInformationDelegate.values.name = name
    }
  }

  /** Creates a new {@link PropertyDelegate} instance, for a property of the
    * associated HomeKit accessory.
    *
    * The property value is accessed through
    * {@link AccessoryDelegate#values values}.
    * The delegate is returned, but can also be accessed through
    * {@link AccessoryDelegate#propertyDelegate propertyDelegate()}.
    * @param {!object} params - Parameters of the property delegate.
    * @param {!string} params.key - The key for the property delegate.<br>
    * Needs to be unique with parent delegate.
    // * @param {!type} params.type - The type of the property value.
    * @param {?*} params.value - The initial value of the property.<br>
    * Only used when the property delegate is created for the first time.
    * Otherwise, the value is restored from persistent storage.
    * @param {?boolean} params.logLevel - Level for homebridge log messages
    * when property was set or has been changed.
    * @param {?string} params.unit - The unit of the value of the property.
    * @throws {TypeError} When a parameter has an invalid type.
    * @throws {RangeError} When a parameter has an invalid value.
    * @throws {SyntaxError} When a mandatory parameter is missing or an
    * optional parameter is not applicable.
    * @returns {PropertyDelegate}
    * @throws {TypeError} When a parameter has an invalid type.
    * @throws {RangeError} When a parameter has an invalid value.
    * @throws {SyntaxError} When a mandatory parameter is missing or an
    * optional parameter is not applicable.
    */
  addPropertyDelegate (params = {}) {
    if (typeof params.key !== 'string') {
      throw new TypeError(`params.key: ${params.key}: invalid key`)
    }
    if (params.key === '') {
      throw new RangeError(`params.key: ${params.key}: invalid key`)
    }
    const key = params.key
    if (this.values[key] !== undefined) {
      throw new SyntaxError(`${key}: duplicate key`)
    }

    const delegate = new homebridgeLib.PropertyDelegate(this, params)
    this._propertyDelegates[key] = delegate

    // Create shortcut for characteristic value.
    Object.defineProperty(this.values, key, {
      configurable: true, // make sure we can delete it again
      writeable: true,
      get () { return delegate.value },
      set (value) { delegate.value = value }
    })

    return delegate
  }

  removePropertyDelegate (key) {
    if (this._accessoryInformationDelegate.values[key] != null) {
      throw new RangeError('%s: invalid key')
    }
    delete this.values[key]
    const delegate = this._propertyDelegates[key]
    delegate._destroy()
    delete this._propertyDelegates[key]
    delete this._context[key]
  }

  /** Returns the property delegate correspondig to the property key.
    * @param {!string} key - The key for the property.
    * returns {PropertyDelegate}
    */
  propertyDelegate (key) {
    return this._propertyDelegates[key]
  }

  /** Values of the HomeKit characteristics for the `AccessoryInformation` service.
    *
    * Contains the key of each property and of each characteristic in
    * {@link ServiceDelegate.AccessoryInformation AccessoryInformation}.
    * When the value is written, the value of the corresponding HomeKit
    * characteristic is updated.
    * @type {object}
    */
  get values () {
    return this._values
  }

  /** Enable `heartbeat` events for this accessory delegate.
    * @type {boolean}
    */
  get heartbeatEnabled () { return this._heartbeatEnabled }

  set heartbeatEnabled (value) { this._heartbeatEnabled = !!value }

  setAlive () {
    this.warn('setAlive() has been deprecated, use heartbeatEnabled instead')
    this._heartbeatEnabled = true
  }

  /** Plugin-specific context to be persisted across Homebridge restarts.
    *
    * After restart, this object is passed back to the plugin through the
    * {@link Platform#event:accessoryRestored accessoryRestored} event.
    * The plugin should store enough information to re-create the accessory
    * delegate, after Homebridge has restored the accessory.
    * @type {object}
    */
  get context () {
    return this._context.context
  }

  /** Current log level.
    *
    * The log level determines what type of messages are printed:
    *
    * 0. Print error and warning messages.
    * 1. Print error, warning, and log messages.
    * 2. Print error, warning, log, and debug messages.
    * 3. Print error, warning, log, debug, and verbose debug messages.
    *
    * Note that debug messages (level 2 and 3) are only printed when
    * Homebridge was started with the `-D` or `--debug` command line option.
    *
    * The log level is initialised at 2 when the accessory is newly created.
    * It can be changed programmatically.
    * The log level is persisted across Homebridge restarts.
    * @type {!integer}
    */
  get logLevel () {
    return this.platform.logLevel
  }

  /** Inherit `logLevel` from another accessory delegate.
    * @param {AccessoryDelegate} delegate - The delegate to inherit `logLevel`
    * from.
    */
  inheritLogLevel (delegate) {
    if (!(delegate instanceof homebridgeLib.AccessoryDelegate)) {
      throw new TypeError('delegate: not an AccessoryDelegate')
    }
    if (delegate === this) {
      throw new RangeError('delegate: cannot inherit from oneself')
    }
    Object.defineProperty(this, 'logLevel', {
      get () { return delegate.logLevel }
    })
  }

  /** Manage `logLevel` from characteristic delegate.
    * @param {CharacteristicDelegate} delegate - The delegate of the `logLevel`
    * characteristic.
    */
  manageLogLevel (delegate) {
    if (!(delegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('delegate: not an CharacteristicDelegate')
    }
    Object.defineProperty(this, 'logLevel', {
      get () { return delegate.value }
    })
  }

  // Called by homebridge when Identify is selected.
  _identify () {
    this.emit('identify')
    this.vdebug('context: %j', this._context)
  }
}

module.exports = AccessoryDelegate
