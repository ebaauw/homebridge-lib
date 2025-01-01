// homebridge-lib/lib/CharacteristicDelegate.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2025 Erik Baauw. All rights reserved.

import { Delegate } from 'homebridge-lib/Delegate'
import { OptionParser } from 'homebridge-lib/OptionParser'
import { ServiceDelegate } from 'homebridge-lib/ServiceDelegate'

/** Delegate of a HomeKit characteristic.
  * <br>See {@link CharacteristicDelegate}.
  * @name CharacteristicDelegate
  * @type {Class}
  * @memberof module:homebridge-lib
  */

/** Delegate of a HomeKit characteristic.
  *
  * A characteristic delegate manages a value that:
  * - Is persisted across homebridge restarts;
  * - Can be monitored through homebridge's log output;
  * - Can be monitored programmatially, through `didSet` events; and
  * - Mirrors the value of the associated HomeKit characteristic:
  *   - When the value is changed from HomeKit, the delegate's value is updated;
  *   - When the value is changed programmatically, the HomeKit characteristic
  * value is updated.
  *
  * A characteristic delegate might be created without an associated
  * characteristic, to manage a value that's hidden from HomeKit, but still
  * need to be persisted (e.g. credentials) or monitored (e.g. derived values).
  *
  * A characteristic delegate might be configured with asynchronous functions
  * to be called when HomeKit tries to read or update the characteristic value:
  * - The `willGet` function is called when HomeKit tries to reads the
  * characteristic value.<br>
  * It returns a promise that resolves to the value to return to HomeKit.
  * When the promise rejects, the previously cached value is returned.
  * - The `willSet` function is called when HomeKit tries to update the
  * characteristic value.<br>
  * It returns a promise that resolves to indicate that the accessory has
  * processed the new value.
  * When the promise rejects, the HomeKit characteristic is reset to the
  * previous value.
  *
  * HomeKit only sets or clears the error state of an accessory when it tries
  * to read or updates a charactertic value.
  * There's no way for an accessory to push the error state to HomeKit.
  * Because of this, the characteristic delegate never returns an error to
  * HomeKit.
  * To indicate that an accessory is in error, use the _Status Fault_
  * characteristic.
  *
  * Because the HomeKit app is unresponsive until the `getter` or `setter`
  * completes, the characteristic delegate provides timeout timers when calling
  * these functions.
  * Timeouts are handled as if the promise had rejected.
  *
  * @extends Delegate
  */
class CharacteristicDelegate extends Delegate {
  /** Create a new instance of a HomeKit characteristic delegate.
    *
    * Note that instances of `CharacteristicDelegate` are normally created by
    * invoking
    * {@link ServiceDelegate#addCharacteristicDelegate addCharacteristicDelegate()}
    * of the associated service delegate.
    * @param {!ServiceDelegate} serviceDelegate - Reference to the corresponding
    * HomeKit service delegate.
    * @param {!object} params - Parameters of the HomeKit characteristic
    * delegate.<br>
    * See
    * {@link ServiceDelegate#addCharacteristicDelegate addCharacteristicDelegate()}

    * @param {!string} params.key - The key for the characteristic delegate.<br>
    * Needs to be unique with the service delegate.
    * @param {?*} params.value - The initial value.<br>
    * Only used when the characteristic delegate is created for the first time.
    * Normally, the value is restored from persistent storage.
    * @param {?boolean} params.silent - Suppress homebridge log messages.
    * @param {?Characteristic} params.Characteristic - The type of the
    * accociated HomeKit characteristic, from
    * {@link Delegate#Characteristic Characteristic}.
    * @param {?object} params.props - The properties of the accociated HomeKit
    * characteristic.<br>
    * Overrides the properties from the characteristic type.
    * @param {?string} params.unit - The unit of the value of the HomeKit
    * characteristic.<br>
    * Overrides the unit from the characteristic type.
    * @param {?function} params.getter - Asynchronous function to be invoked
    * when HomeKit tries to read the characteristic value.<br>
    * This must be an `async` function returning a `Promise` to the new
    * characteristic value.
    * @param {?function} params.setter - Asynchronous function to be invoked
    * when HomeKit tries to update the characteristic value.<br>
    * This must be an `async` function returning a `Promise` that resolves
    * when the corresonding accessory has processed the updated value.
    * @param {integer} [params.timeout=1000] - Timeout (in msec) for blocking
    * HomeKit while waiting for the getter or setter.
    * @throws {TypeError} When a parameter has an invalid type.
    * @throws {RangeError} When a parameter has an invalid value.
    * @throws {SyntaxError} When a mandatory parameter is missing or an
    * optional parameter is not applicable.
    */
  constructor (serviceDelegate, params = {}) {
    if (!(serviceDelegate instanceof ServiceDelegate)) {
      throw new TypeError('serviceDelegate: not a ServiceDelegate')
    }
    super(serviceDelegate.platform, serviceDelegate.name)
    if (typeof params.key !== 'string') {
      throw new TypeError('params.key: not a string')
    }
    if (params.Characteristic != null) {
      if (
        typeof params.Characteristic !== 'function' ||
        typeof params.Characteristic.UUID !== 'string'
      ) {
        throw new TypeError(
          `params.Characteristic: ${params.Characteristic}: not a Characteristic`
        )
      }
    }
    this._serviceDelegate = serviceDelegate
    this._service = this._serviceDelegate._service
    this._key = params.key
    this._log = params.silent ? this.debug : this.log

    if (params.Characteristic != null) {
      const Characteristic = params.Characteristic
      if (this._service.testCharacteristic(Characteristic)) {
        this._characteristic = this._service.getCharacteristic(Characteristic)
      } else {
        this._characteristic = this._service.addCharacteristic(Characteristic)
      }
      if (params.props != null) {
        if (this._characteristic.value < params.props.minValue) {
          this._characteristic.updateValue(params.props.minValue)
        }
        this._characteristic.setProps(params.props)
      }
      if (this._characteristic.props.unit != null) {
        this._unit = ' ' + this._characteristic.props.unit
      }
      // Install getter and setter when needed.
      if (params.getter != null && typeof params.getter === 'function') {
        this._getter = params.getter
        this._onGetCount = 0
        this._characteristic.on('get', this._onGet.bind(this))
      }
      if (this._canWrite && Characteristic !== this.Characteristics.hap.Identify) {
        if (params.setter != null && typeof params.setter === 'function') {
          this._setter = params.setter
        }
        this._characteristic.on('set', this._onSet.bind(this))
      }
      this._timeout = OptionParser.toInt(
        'params.timeout', params.timeout == null ? 1000 : params.timeout, 500, 5000
      )
      // Check that we are the only listener
      if (this._characteristic.listenerCount('set') > 1) {
        this.warn('%d listeners', this._characteristic.listenerCount('set'))
      }
    }
    if (params.unit != null) {
      this._unit = params.unit
    } else if (this._unit == null) {
      this._unit = ''
    }

    // Set initial value.
    if (this.value == null && params.value != null) {
      this.value = params.value
      if (this._characteristic != null) {
        this._characteristic.updateValue(this.value)
      }
    }
  }

  /** Destroy characteristic delegate and delete associated HomeKit characteristic.
    * @params {boolean} [delegateOnly=false] - Destroy the delegate, but keep the
    * associated HomeKit characteristic (including context).
    */
  _destroy (delegateOnly = false) {
    this.debug('destroy %s', this._key)
    this.removeAllListeners()
    if (delegateOnly) {
      if (this._characteristic != null) {
        // this._characteristic.removeAllListeners() // Doesn't work ?!
        this._characteristic.removeAllListeners('get')
        this._characteristic.removeAllListeners('set')
      }
      return
    }
    if (this._characteristic != null) {
      this._service.removeCharacteristic(this._characteristic)
    }
    delete this._serviceDelegate._context[this.key]
  }

  // Check characteristic permissions.
  _hasPerm (perm) {
    return this._characteristic == null
      ? false
      : this._characteristic.props.perms.includes(perm)
  }

  get _canRead () {
    return this._hasPerm(this.Characteristic.Perms.PAIRED_READ)
  }

  get _canWrite () {
    return this._hasPerm(this.Characteristic.Perms.PAIRED_WRITE)
  }

  get _canNotify () {
    return this._hasPerm(this.Characteristic.Perms.NOTIFY)
  }

  get _writeResponse () {
    return this._hasPerm(this.Characteristic.Perms.WRITE_RESPONSE)
  }

  get _writeOnly () {
    return this._canWrite && !this._canRead && !this._canNotifiy
  }

  get _notifyOnly () {
    return this._characteristic == null
      ? false
      : this._characteristic.UUID ===
        this.Characteristics.hap.ProgrammableSwitchEvent.UUID
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
    return this._serviceDelegate._accessoryDelegate.logLevel
  }

  get displayName () {
    return this._characteristic == null
      ? this._key
      : this._characteristic.displayName
  }

  get _namePrefix () {
    return this._serviceDelegate._namePrefix + this.displayName + ': '
  }

  validate (value) {
    let s = ''
    if (this._characteristic != null) {
      switch (this._characteristic.props.format) {
        case this.Characteristic.Formats.BOOL:
          break
        case this.Characteristic.Formats.UINT8:
        case this.Characteristic.Formats.UINT16:
        case this.Characteristic.Formats.UINT32:
        case this.Characteristic.Formats.UINT64:
        case this.Characteristic.Formats.INT:
          value = Math.round(value)
          // fallsthrough
        case this.Characteristic.Formats.FLOAT:
          if (value < this._characteristic.props.minValue) {
            value = this._characteristic.props.minValue
            s = ' [min]'
          } else if (value > this._characteristic.props.maxValue) {
            value = this._characteristic.props.maxValue
            s = ' [max]'
          }
          break
        case this.Characteristic.Formats.STRING:
          if (
            value != null && value.length > this._characteristic.props.length
          ) {
            value = value.slice(0, this._characteristic.props.length)
            s = ' [truncated]'
          }
          break
        default:
          break
      }
    }
    return { value, s }
  }

  /** Value of associated Characteristic.
    */
  get value () {
    return this._serviceDelegate._context[this._key]
  }

  set value (v) {
    const { value, s } = this.validate(v)

    // Check for actual change.
    if (value === this.value && !this._notifyOnly) {
      return
    }

    // Issue info message that Characteristic value is updated by the plugin.
    if (this._notifyOnly) {
      this._log('%s%s', ['Single Press', 'Double Press', 'Long Press'][value], s)
    } else if (this.value == null) {
      this._log('set to %j%s%s', value, this._unit, s)
    } else {
      this._log('set to %j%s%s (from %j%s)', value, this._unit, s, this.value, this._unit)
    }

    // Update persisted value in ~/.homebridge/accessories/cachedAccessories.
    this._serviceDelegate._context[this._key] = value

    if (this._characteristic != null) {
      // Update value of associated Characteristic.
      this._characteristic.updateValue(value)
    }

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

  /** Set the value of the associated HomeKit characteristic.
    */
  setValue (value) {
    if (this._characteristic != null) {
      // Update value of associated Characteristic.
      this._characteristic.setValue(value)
    }
  }

  // Called when characteristic with a getter is read from HomeKit.
  async _onGet (callback) {
    let timedOut = false
    let value = this.value
    const timeout = setTimeout(() => {
      timedOut = true
      try {
        callback(null, this.value)
      } catch (error) { this.warn(error) }
    }, this._timeout)
    try {
      value = await this._getter()
    } catch (error) {
      this.error(error)
    }
    clearTimeout(timeout)

    if (timedOut) {
      this._log('get: ignore %j%s - timed out', value, this._unit)
    } else {
      // Return value to HomeKit.
      this._log('get: return %j%s', value, this._unit)
      try {
        callback(null, value)
      } catch (error) { this.warn(error) }
    }

    if (value !== this.value) {
      // Update persisted value in ~/.homebridge/accessories/cachedAccessories.
      this._serviceDelegate._context[this._key] = value

      // Inform service delegate.
      this.emit('didSet', value, false)
    }
  }

  // Called when characteristic is updated from HomeKit.
  async _onSet (v, callback) {
    const { value } = this.validate(v)
    let result

    // Issue info message that Characteristic value was updated from HomeKit.
    if (this._writeOnly || this.value == null) {
      this._log('changed to %j%s', value, this._unit)
    } else if (value !== this.value) {
      this._log('changed to %j%s (from %j%s)', value, this._unit, this.value, this._unit)
    }

    // Check for actual change.
    if (value === this.value && !this._writeOnly) {
      /** Emitted when Homebridge characteristic value has not changed, but
        * HomeKit issued an update anyways.
        * @event CharacteristicDelegate#didTouch
        * @param {*} value - The (unchanged) characteristic value.
        * @param {boolean} byHomeKit - Value was set by HomeKit (always true).
        */
      this.emit('didTouch', value, true)
      try {
        callback()
      } catch (error) { this.warn(error) }
      return
    }

    // Invoke setter if defined, but guard with a timeout.
    if (this._setter) {
      let timedOut = false
      const timeout = setTimeout(() => {
        timedOut = true
        this.warn('set: timed out')
        try {
          callback(new Error('timed out'))
        } catch (error) { this.warn(error) }
      }, this._timeout)
      try {
        result = await this._setter(value)
      } catch (error) {
        clearTimeout(timeout)
        this.warn('set: %s', error)
        if (!timedOut) {
          try {
            callback(error)
          } catch (error) { this.warn(error) }
        }
        return
      }
      clearTimeout(timeout)
      if (timedOut) {
        return
      }
    }

    // Return status to HomeKit.
    if (this._writeResponse) {
      try {
        callback(null, result)
      } catch (error) { this.warn(error) }
    } else {
      try {
        callback()
      } catch (error) { this.warn(error) }
    }

    // Update persisted value in ~/.homebridge/accessories/cachedAccessories.
    this._serviceDelegate._context[this._key] = value

    // Inform service delegate.
    this.emit('didSet', value, true)
  }
}

export { CharacteristicDelegate }
