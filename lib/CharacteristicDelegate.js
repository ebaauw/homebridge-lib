// homebridge-lib/lib/CharacteristicDelegate.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2019 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

/** Class for a HomeKit characteristic delegate.
  *
  * @extends Delegate
  */
class CharacteristicDelegate extends homebridgeLib.Delegate {
  /** Create a new instance of a HomeKit chracteristic delegate.
    *
    * @param {!ServiceDelegate} serviceDelegate - Reference to the corresponding
    * HomeKit service delegate.
    * @param {!object} params - Properties of the HomeKit characteristic.
    * @param {!string} params.key - The key for the characteristic.
    * @param {!Characteristic} params.Characteristic - The type of the
    * characteristic, from {@link Delegate#Characteristic Characteristic}.
    * @param {?object} params.props - The properties of the HomeKit
    * characteristic.<br>
    * Overrides the properties from the characteristic type.
    * @param {?string} params.unit - The unit of the value of the HomeKit
    * characteristic.<br>
    * Overrides the unit from the characteristic type.
    * @param {?function} params.getter - Function to invoke when
    * HomeKit reads the characteristic value.<br>
    * This must be an `async` function returning a `Promise` to the
    * characteristic value.
    */
  constructor (serviceDelegate, params = {}) {
    if (!(serviceDelegate instanceof homebridgeLib.ServiceDelegate)) {
      throw new TypeError('serviceDelegate: not a ServiceDelegate')
    }
    super(serviceDelegate._platform, serviceDelegate.name)
    if (
      typeof params.Characteristic !== 'function' ||
      typeof params.Characteristic.UUID !== 'string'
    ) {
      throw new TypeError(
        `params.Characteristic: ${params.Characteristic}: not a Characteristic`
      )
    }
    if (typeof params.key !== 'string') {
      throw new TypeError(`params.key: ${params.key}: not a string`)
    }
    if (params.key === '') {
      throw new RangeError(`params.key: ${params.key}: invalid key`)
    }
    this._serviceDelegate = serviceDelegate
    this._key = params.key

    // Get or create associated Characteristic.
    const Characteristic = params.Characteristic
    this._serviceDelegate._service.addOptionalCharacteristic(Characteristic)
    this._characteristic = this._serviceDelegate._service
      .getCharacteristic(Characteristic)
    if (params.props != null) {
      this._characteristic.setProps(params.props)
    }
    if (params.unit != null) {
      this._unit = params.unit
    } else if (this._characteristic.props.unit != null) {
      this._unit = ' ' + this._characteristic.props.unit
    } else {
      this._unit = ''
    }
    if (params.getter != null && typeof params.getter === 'function') {
      this._getter = params.getter
      this._characteristic.on('get', this._onGet.bind(this))
    }
    if (this._canWrite) {
      this._characteristic.on('set', this._onSet.bind(this))
    }

    // Set initial value.
    if (this.value == null && params.value != null) {
      this.value = params.value
    }
  }

  get _canRead () {
    return this._characteristic.props.perms.includes(
      this.Characteristic.hap.Perms.READ
    )
  }

  get _canWrite () {
    return this._characteristic.props.perms.includes(
      this.Characteristic.hap.Perms.WRITE
    )
  }

  get _canNotify () {
    return this._characteristic.props.perms.includes(
      this.Characteristic.hap.Perms.NOTIFY
    )
  }

  get _writeOnly () {
    return this._canWrite && !this._canRead && !this._canNotifiy
  }

  get _notifyOnly () {
    return this._characteristic.eventOnlyCharacteristic
    // return this._canNotify && !this._canRead && !this._canWrite
  }

  /**
   * Value of associated Characteristic.
   */
  get value () {
    return this._serviceDelegate._context[this._key]
  }
  set value (value) {
    // Check for actual change.
    if (value === this.value && !this._notifyOnly) {
      return
    }

    // Issue info message that Characteristic value is updated by the plugin.
    if (this._notifyOnly || this.value == null) {
      this.log(
        'set %s to %s%s', this._characteristic.displayName,
        value, this._unit
      )
    } else /* if (this._characteristic.UUID !== this.Characteristic.my.LastUpdated.UUID) */ {
      this.log(
        'set %s from %s%s to %s%s', this._characteristic.displayName,
        this.value, this._unit, value, this._unit
      )
    }

    // Update persisted value in ~/.homebridge/accessories/cachedAccessories.
    this._serviceDelegate._context[this._key] = value

    // Update value of associated Characteristic.
    this._characteristic.updateValue(value)

    /** Emitted when Homebridge characteristic value has changed, either from
      * HomeKit or by the plugin.
      *
      * On receiving this event, the plugin should update the corresponding
      * device attribute.
      * @event CharacteristicDelegate#didSet
      * @param {*} value - The new characteristic value.
      * @param {boolean} byHomeKit - Value was set by HomeKit.
      */
    this.emit('didSet', value, false)
  }

  // Called when characteristic is updated from HomeKit.
  _onSet (value, callback) {
    // Check for actual change.
    if (value === this.value && !this._writeOnly) {
      return callback()
    }

    // Issue info message that Characteristic value was updated from HomeKit.
    if (this._writeOnly || this.value == null) {
      this.log(
        '%s changed to %s%s', this._characteristic.displayName,
        value, this._unit
      )
    } else {
      this.log(
        '%s changed from %s%s to %s%s', this._characteristic.displayName,
        this.value, this._unit, value, this._unit
      )
    }

    // Update persisted value in ~/.homebridge/accessories/cachedAccessories.
    this._serviceDelegate._context[this._key] = value

    // Inform service delegate.
    this.emit('didSet', value, true)

    // Return status to HomeKit.
    return callback()
  }

  // Called when characteristic is read from HomeKit.
  async _onGet (callback) {
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      this.warn(
        'get %s: timeout - return previous value %s%s',
        this._characteristic.displayName, this.value, this._unit
      )
      callback(null, this.value)
    }, 1000)
    try {
      const value = await this._getter()
      if (timedOut) {
        this.log(
          'get %s: ignore %s%s - timed out', this._characteristic.displayName,
          value, this._unit
        )
        return
      }
      clearTimeout(timeout)
      this.log(
        'get %s return %s%s', this._characteristic.displayName, value, this._unit
      )
      if (value !== this.value) {
        this._serviceDelegate._context[this._key] = value
        this.emit('didSet', value, false)
      }
      callback(null, value)
    } catch (error) {
      this.error(error)
      if (timedOut) {
        return
      }
      clearTimeout(timeout)
      callback(error)
    }
  }
}

module.exports = CharacteristicDelegate
