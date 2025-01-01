// homebridge-lib/lib/PropertyDelegate.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2025 Erik Baauw. All rights reserved.

import { AccessoryDelegate } from 'homebridge-lib/AccessoryDelegate'
import { Delegate } from 'homebridge-lib/Delegate'

/** Delegate of a property of a HomeKit accessory or service.
  * <br>See {@link PropertyDelegate}.
  * @name PropertyDelegate
  * @type {Class}
  * @memberof module:homebridge-lib
  */

/** Delegate of a property of a delegate of a HomeKit accessory or HomeKit
  * service.
  *
  * A property delegate manages a property value that:
  * - Is persisted across homebridge restarts;
  * - Can be monitored through homebridge's log output;
  * - Can be monitored programmatically, through
  * {@link PropertyDelegate#event:didSet didSet} events.
  *
  * @extends Delegate
  */
class PropertyDelegate extends Delegate {
  /** Instantiate a property delegate.
    *
    * Note that instances are normally created by invoking
    * {@link AccessoryDelegate#addPropertyDelegate addPropertyDelegate()}.
    * @param {!AccessoryDelegate|ServiceDelegate} delegate - Reference to the
    * delegate of the corresponding HomeKit accessory or service.
    * @param {!object} params - Parameters of the property delegate.
    * @param {!string} params.key - The key for the property delegate.<br>
    * Needs to be unique with parent delegate.
    * @param {?boolean} params.silent - Suppress set log messages.
    // * @param {!type} params.type - The type of the property value.
    * @param {?*} params.value - The initial value of the property.<br>
    * Only used when the property delegate is created for the first time.
    * Otherwise, the value is restored from persistent storage.
    * @param {?string} params.unit - The unit of the value of the property.
    * @throws {TypeError} When a parameter has an invalid type.
    * @throws {RangeError} When a parameter has an invalid value.
    * @throws {SyntaxError} When a mandatory parameter is missing or an
    * optional parameter is not applicable.
    */
  constructor (parent, params = {}) {
    if (!(parent instanceof AccessoryDelegate)) {
      throw new TypeError('parent: not an AccessoryDelegate')
    }
    super(parent.platform, parent.name + ': ' + params.key)
    if (typeof params.key !== 'string') {
      throw new TypeError('params.key: not a string')
    }
    this._parent = parent
    this._key = params.key
    this._log = params.silent ? this.debug : this.log
    // this._type = params.type
    this._unit = params.unit ?? ''

    // Set initial value.
    if (this.value == null && params.value != null) {
      this.value = params.value
    }
  }

  /** Destroy the propery delegate.
    * @params {boolean} [delegateOnly=false] - Destroy the delegate, but keep the
    * associated value in context.
    */
  _destroy (delegateOnly = false) {
    this.vdebug('destroy')
    this.removeAllListeners()
    if (delegateOnly) {
      return
    }
    delete this._parent._context[this.key]
  }

  /** Current log level (of the associated accessory or service delegate).
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
    return this._parent.logLevel
  }

  get _namePrefix () {
    return this._parent._namePrefix + this._key + ': '
  }

  validate (value) {
    // Todo: check value against type.
    return { value, s: '' }
  }

  /** Value of associated Characteristic.
    */
  get value () {
    return this._parent._context[this._key]
  }

  set value (v) {
    const { value, s } = this.validate(v)

    // Check for actual change.
    if (value === this.value) {
      return
    }

    // Issue info message that property value has been set.
    if (this.value == null) {
      this._log('set to %j%s%s', value, this._unit, s)
    } else {
      this._log(
        'set to %j%s%s (from %j%s)', value, this._unit, s, this.value, this._unit
      )
    }

    // Update persisted value in ~/.homebridge/accessories/cachedAccessories.
    this._parent._context[this._key] = value

    /** Emitted when property value has changed.
      * @event PropertyDelegate#didSet
      * @param {*} value - The new property value.
      */
    this.emit('didSet', value)
  }
}

export { PropertyDelegate }
