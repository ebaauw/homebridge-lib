// homebridge-lib/lib/AccessoryDelegate.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2025 Erik Baauw. All rights reserved.

import { CharacteristicDelegate } from 'homebridge-lib/CharacteristicDelegate'
import { Delegate } from 'homebridge-lib/Delegate'
import { PropertyDelegate } from 'homebridge-lib/PropertyDelegate'
import { ServiceDelegate } from 'homebridge-lib/ServiceDelegate'
import 'homebridge-lib/ServiceDelegate/AccessoryInformation'

const startsWithUuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/

/** Delegate of a HomeKit accessory.
  * <br>See {@link AccessoryDelegate}.
  * @name AccessoryDelegate
  * @type {Class}
  * @memberof module:homebridge-lib
  */

/** Delegate of a HomeKit accessory.
  *
  * @abstract
  * @extends Delegate
  */
class AccessoryDelegate extends Delegate {
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
    * @param {?integer} params.logLevel - The log level for the accessory
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
    if (params.logLevel == null) {
      params.logLevel = platform.logLevel
    }

    // Link or create associated PlatformAccessory.
    this._accessory = this._platform._getAccessory(this, params)
    this._context = this._accessory.context

    // Setup shortcut for property values and values of the characteristics
    // of the _Accessory Information_ service.
    this._values = {} // by key
    this._propertyDelegates = {}
    this.addPropertyDelegate({ key: 'className', value: this.constructor.name, silent: true })
    this.addPropertyDelegate({ key: 'version', silent: true })
    this.values.version = platform.packageJson.version
    this.addPropertyDelegate({ key: 'id', value: params.id, silent: true })
    this.addPropertyDelegate({ key: 'logLevel', value: params.logLevel })
    this.addPropertyDelegate({ key: 'name', value: this.name, silent: true })
      .on('didSet', (name) => { this.name = name })
    if (typeof platform.onUiRequest === 'function') {
      this.addPropertyDelegate({ key: 'uiPort', silent: true })
      if (platform._ui != null) {
        this.values.uiPort = platform._ui.port
      }
    }

    // Create delegate for AccessoryInformation service.
    this._serviceDelegates = {}
    this._accessoryInformationDelegate = new ServiceDelegate.AccessoryInformation(this, params)

    // Configure PlatformAccessory.
    this._accessory.on('identify', this._identify.bind(this))

    this.once('initialised', () => {
      const staleServices = []
      for (const service of this._accessory.services) {
        const key = service.UUID +
          (service.subtype == null ? '' : '.' + service.subtype)
        if (this._serviceDelegates[key] == null) {
          if (service.UUID !== this.Services.hap.ProtocolInformation.UUID) {
            service.key = key
            staleServices.push(service)
          }
        } else {
          this._serviceDelegates[key].emit('initialised')
        }
      }
      for (const service of staleServices) {
        this.warn('remove stale service %s (%s)', service.key, service.constructor.name)
        this._accessory.removeService(service)
      }
      const staleKeys = []
      for (const key in this._context) {
        if (startsWithUuid.test(key)) {
          if (this._serviceDelegates[key] == null) {
            staleKeys.push(key)
          }
        } else {
          if (key !== 'context' && this._propertyDelegates[key] == null) {
            staleKeys.push(key)
          }
        }
      }
      for (const key of staleKeys) {
        this.warn('remove stale context %s', key)
        delete this._context[key]
      }
    })
  }

  /** Destroy accessory delegate and associated HomeKit accessory.
    * @params {boolean} [delegateOnly=false] - Destroy the delegate, but keep the
    * associated HomeKit accessory (including context).
    */
  destroy (delegateOnly = false) {
    this.removeAllListeners()
    for (const key in this._serviceDelegates) {
      this._serviceDelegates[key].destroy(delegateOnly)
    }
    for (const key in this._propertyDelegates) {
      this._propertyDelegates[key]._destroy(delegateOnly)
    }
    if (delegateOnly) {
      this._accessory.removeAllListeners()
      return
    }
    this._platform._removeAccessory(this._accessory)
  }

  _linkServiceDelegate (serviceDelegate) {
    const key = serviceDelegate._key
    // this.debug('link service %s', key)
    this._serviceDelegates[key] = serviceDelegate
    return serviceDelegate
  }

  _unlinkServiceDelegate (serviceDelegate, delegateOnly) {
    const key = serviceDelegate._key
    // this.debug('unlink service %s', key)
    delete this._serviceDelegates[key]
    if (delegateOnly) {
      return
    }
    delete this._context[key]
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
    if (this._values[key] !== undefined) {
      throw new SyntaxError(`${key}: duplicate key`)
    }

    const delegate = new PropertyDelegate(this, params)
    this._propertyDelegates[key] = delegate

    // Create shortcut for characteristic value.
    Object.defineProperty(this._values, key, {
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
    delete this._values[key]
    const delegate = this._propertyDelegates[key]
    delegate._destroy()
    delete this._propertyDelegates[key]
    delete this.context[key]
  }

  /** Returns the property delegate correspondig to the property key.
    * @param {!string} key - The key for the property.
    * @returns {PropertyDelegate}
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
    return this.values.logLevel == null ? this.platform.logLevel : this.values.logLevel
  }

  /** Inherit `logLevel` from another accessory delegate.
    * @param {AccessoryDelegate} delegate - The delegate to inherit `logLevel`
    * from.
    */
  inheritLogLevel (delegate) {
    if (!(delegate instanceof AccessoryDelegate)) {
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
    * @param {CharacteristicDelegate|PropertyDelegate} delegate - The delegate
    * of the `logLevel` characteristic.
    * @param {Boolean} [forPlatform=false] - Manage the Platform `logLevel` as
    * well.
    */
  manageLogLevel (delegate, forPlatform = false) {
    if (
      !(delegate instanceof CharacteristicDelegate) &&
      !(delegate instanceof PropertyDelegate)
    ) {
      throw new TypeError('delegate: not a CharacteristicDelegate or PropertyDelegate')
    }
    Object.defineProperty(this, 'logLevel', {
      get () { return delegate.value }
    })
    if (forPlatform) {
      try {
        // TODO handle multiple delegates for platform log level
        //      now platform log level is linked to first delegate only
        Object.defineProperty(this.platform, 'logLevel', {
          get () { return delegate.value }
        })
      } catch (error) { }
    }
  }

  // Called by homebridge when Identify is selected.
  _identify () {
    this.emit('identify')
    this.vdebug('context: %j', this._context)
  }
}

export { AccessoryDelegate }
