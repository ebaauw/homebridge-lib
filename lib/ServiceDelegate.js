// homebridge-lib/lib/ServiceDelegate.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2025 Erik Baauw. All rights reserved.

import { AccessoryDelegate } from 'homebridge-lib/AccessoryDelegate'
import { CharacteristicDelegate } from 'homebridge-lib/CharacteristicDelegate'
import { Delegate } from 'homebridge-lib/Delegate'

/** Delegate of a HomeKit service.
  * <br>See {@link ServiceDelegate}.
  * @name ServiceDelegate
  * @type {Class}
  * @memberof module:homebridge-lib
  */

/** Delegate of a HomeKit service.
  *
  * This delegate sets up a HomeKit service with the following HomeKit
  * characteristic:
  *
  * key              | Characteristic
  * ---------------- | -----------------------------------
  * `name`           | `Characteristics.hap.Name`
  * `configuredName` | `Characteristics.hap.ConfiguredName`
  * @abstract
  * @extends Delegate
  */
class ServiceDelegate extends Delegate {
  /** Create a new instance of a HomeKit service delegate.
    *
    * When the associated HomeKit service was restored from persistent
    * storage, it is linked to the new delegate. Otherwise a new HomeKit
    * service will be created, using the values from `params`.
    * @param {!AccessoryDelegate} accessoryDelegate - Reference to the
    * associated HomeKit accessory delegate.
    * @param {!object} params - Properties of the HomeKit service.<br>
    * Next to the fixed properties below, `params` also contains the value for
    * each key specified in {@link ServiceDelegate#characteristics characteristics}.
    * @param {!string} params.name - The (Siri) name of the service.
    * Also used to prefix log and error messages.
    * @param {!Service} params.Service - The type of the HomeKit service.
    * @param {?string} params.subtype - The subtype of the HomeKit service.
    * Needs to be specified when the accessory has multuple services of the
    * same type.
    * @params {?boolean} params.primaryService - This is the primary service
    * for the accessory.
    * @params {?ServiceDelegate} params.linkedServiceDelegate - The delegate
    * of the service this service links to.
    * @params {?boolean} params.hidden - Hidden service.
    */
  constructor (accessoryDelegate, params = {}) {
    if (!(accessoryDelegate instanceof AccessoryDelegate)) {
      throw new TypeError('parent: not a AccessoryDelegate')
    }
    if (params.name == null) {
      throw new SyntaxError('params.name: missing')
    }
    super(accessoryDelegate.platform, params.name)
    if (
      typeof params.Service !== 'function' ||
      typeof params.Service.UUID !== 'string'
    ) {
      throw new TypeError('params.Service: not a Service')
    }
    this._accessoryDelegate = accessoryDelegate
    this._accessory = this._accessoryDelegate._accessory
    this._key = params.Service.UUID
    if (params.subtype != null) {
      this._key += '.' + params.subtype
    }

    // Get or create associated Service.
    this._service = params.subtype == null
      ? this._accessory.getService(params.Service)
      : this._accessory.getServiceById(params.Service, params.subtype)
    if (this._service == null) {
      this._service = this._accessory.addService(
        new params.Service(null, params.subtype)
      )
    }
    this._accessoryDelegate._linkServiceDelegate(this)
    this._service.setPrimaryService(!!params.primaryService)
    if (params.linkedServiceDelegate != null) {
      params.linkedServiceDelegate._service.addLinkedService(this._service)
    }
    this._service.setHiddenService(!!params.hidden)

    // Setup persisted storage in ~/.homebridge/accessories/cachedAccessories.
    if (this._accessory.context[this._key] == null) {
      this._accessory.context[this._key] = {}
    }
    this._context = this._accessory.context[this._key]

    // Setup shortcut for characteristic values.
    this._values = {} // by key

    // Setup characteristics
    this._characteristicDelegates = {} // by key
    this._characteristics = {} // by uuid

    this.addCharacteristicDelegate({
      key: 'name',
      Characteristic: this.Characteristics.hap.Name,
      value: params.name
    })
    this.name = this.values.name
    if (this._service.constructor.name !== 'AccessoryInformation') {
      this.addCharacteristicDelegate({
        key: 'configuredName',
        Characteristic: this.Characteristics.hap.ConfiguredName,
        props: {
          perms: [
            this.Characteristic.Perms.PAIRED_READ,
            this.Characteristic.Perms.NOTIFY,
            this.Characteristic.Perms.PAIRED_WRITE,
            this.Characteristic.Perms.HIDDEN
          ]
        },
        value: params.name,
        setter: (value) => {
          if (value == null || value === '') {
            throw new RangeError('cannot be empty')
          }
        }
      }).on('didSet', (value) => {
        this.name = value
        this.values.name = value
        if (params.primaryService) {
          accessoryDelegate.values.name = value
        }
      })
    }

    this.once('initialised', () => {
      const staleCharacteristics = []
      for (const uuid in this._service.characteristics) {
        const characteristic = this._service.characteristics[uuid]
        if (this._characteristics[characteristic.UUID] == null) {
          staleCharacteristics.push(characteristic)
        }
      }
      for (const characteristic of staleCharacteristics) {
        this.log('remove stale characteristic %s', characteristic.displayName)
        this._service.removeCharacteristic(characteristic)
      }
      const staleKeys = []
      for (const key in this._context) {
        if (key !== 'context' && this._characteristicDelegates[key] == null) {
          staleKeys.push(key)
        }
      }
      for (const key of staleKeys) {
        this.log('remove stale value %s', key)
        delete this._context[key]
      }
    })
  }

  /** Destroy service delegate and associated HomeKit service.
    * @params {boolean} [delegateOnly=false] - Destroy the delegate, but keep the
    * associated HomeKit service (including context).
    */
  destroy (delegateOnly = false) {
    this.debug('destroy %s (%s)', this._key, this.constructor.name)
    this._accessoryDelegate._unlinkServiceDelegate(this, delegateOnly)
    this.removeAllListeners()
    for (const key in this._characteristicDelegates) {
      this._characteristicDelegates[key]._destroy(delegateOnly)
    }
    if (delegateOnly) {
      this._service.removeAllListeners()
      return
    }
    this._accessory.removeService(this._service)
    delete this._accessory.context[this._key]
  }

  /** Add a HomeKit characteristic delegate to the HomeKit service delegate.
    *
    * The characteristic delegate manages a value that:
    * - Is persisted across homebridge restarts;
    * - Can be monitored through homebridge's log output;
    * - Can be monitored programmatially through `didSet` events; and
    * - Mirrors the value of the optionally associated HomeKit characteristic.
    *
    * This value is accessed through {@link ServiceDelegate#values values}.
    * The delegate is returned, but can also be accessed through
    * {@link ServiceDelegate#characteristicDelegate characteristicDelegate()}.
    *
    * When the associated HomeKit characteristic was restored from persistent
    * storage, it is linked to the new delegate. Otherwise a new HomeKit
    * charactertistic will be created, using the values from `params`.
    * @param {!object} params - Properties of the HomeKit characteristic.
    * @param {!string} params.key - The key for the characteristic.
    * @param {?*} params.value - The initial value when the characteristic
    * is added.
    * @param {?boolean} params.silent - Suppress set log messages.
    * @param {?Characteristic} params.Characteristic - The type of the
    * characteristic, from {@link Delegate#Characteristic Characteristic}.
    * @param {?object} params.props - The properties of the HomeKit
    * characteristic.<br>
    * Overrides the properties from the characteristic type.
    * @param {?string} params.unit - The unit of the value of the HomeKit
    * characteristic.<br>
    * Overrides the unit from the characteristic type.
    * @param {?function} params.getter - Asynchronous function to be invoked
    * when HomeKit reads the characteristic value.<br>
    * This must be an `async` function returning a `Promise` to the new
    * characteristic value.
    * @param {?function} params.setter - Asynchronous function to be invoked
    * when HomeKit writes the characteristic value.<br>
    * This must be an `async` function returning a `Promise` that resolves
    * when the corresonding device value has been updated.
    * @returns {CharacteristicDelegate}
    * @throws {TypeError} When a parameter has an invalid type.
    * @throws {RangeError} When a parameter has an invalid value.
    * @throws {SyntaxError} When a mandatory parameter is missing or an
    * optional parameter is not applicable.
    */
  addCharacteristicDelegate (params = {}) {
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

    const characteristicDelegate = new CharacteristicDelegate(
      this, params
    )
    this._characteristicDelegates[key] = characteristicDelegate
    if (params.Characteristic != null) {
      this._characteristics[params.Characteristic.UUID] = true
    }

    // Create shortcut for characteristic value.
    Object.defineProperty(this.values, key, {
      configurable: true, // make sure we can delete it again
      writeable: true,
      get () { return characteristicDelegate.value },
      set (value) { characteristicDelegate.value = value }
    })

    return characteristicDelegate
  }

  removeCharacteristicDelegate (key) {
    delete this.values[key]
    const characteristicDelegate = this._characteristicDelegates[key]
    if (characteristicDelegate._characteristic != null) {
      const characteristic = characteristicDelegate._characteristic
      delete this._characteristics[characteristic.UUID]
    }
    characteristicDelegate._destroy()
    delete this._characteristicDelegates[key]
    delete this._context[key]
  }

  /** Values of the HomeKit characteristics for the HomeKit service.
    *
    * Contains the key of each characteristic added by
    * {@link ServiceDelegate#addCharacteristic addCharacteristic}.
    * When the value is written, the value of the corresponding HomeKit
    * characteristic is updated; when the characteristic value is changed from
    * HomeKit, this value is updated.
    * @type {object}
    */
  get values () {
    return this._values
  }

  /** Returns the HomeKit characteristic delegate correspondig to the key.
    * @param {!string} key - The key for the characteristic.
    * returns {CharacteristicDelegate}
    */
  characteristicDelegate (key) {
    return this._characteristicDelegates[key]
  }

  /** The corrresponding HomeKit accessory delegate.
    * @type {AccessoryDelegate}
    */
  get accessoryDelegate () {
    return this._accessoryDelegate
  }

  /** Service context to be persisted across Homebridge restarts.
    * @type {object}
    */
  get context () {
    if (this._context.context == null) {
      this._context.context = {}
    }
    return this._context.context
  }

  /** Current log level (of the associated accessory delegate).
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
    * @type {!integer}
    * @readonly
    */
  get logLevel () {
    return this._accessoryDelegate.logLevel
  }
}

export { ServiceDelegate }
