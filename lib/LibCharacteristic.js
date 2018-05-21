// homebridge-lib/lib/LibCharacteristic.js
//
// Library for homebridge plug-ins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.
//
// See https://github.com/ebaauw/homebridge-lib/wiki/LibCharacteristic.

'use strict'

const homebridgeLib = require('../index')

// Delegate for Characteristic.
module.exports = class LibCharacteristic extends homebridgeLib.LibObject {
  // ===== Constructor =========================================================

  constructor (parent, params) {
    super(parent._platform, params.name)
    this._parent = parent
    this._context = parent._context
    this._key = params.key
    this._unit = params.unit || ''

    // Get or create associated Characteristic.
    const Char = this.Characteristic[params.charName]
    this._characteristic = parent._service.getCharacteristic(Char)
    if (this._isWriteable) {
      this._characteristic.on('set', (value, callback) => {
        if (value === this._value) {
          return callback()
        }
        this.log(
          '%s changed from %s%s to %s%s', this._characteristic.displayName,
          this._value, this._unit, value, this._unit
        )
        this._context[this._key] = value
        parent.emit('didSet', this._key, value)
        return callback()
      })
    }

    // Create associated property in associated LibService.
    if (this._key === 'id') {
      Object.defineProperty(parent, this._key, {
        get: () => {
          return this._value
        }
      })
    } else if (this._key !== 'name') {
      Object.defineProperty(parent, this._key, {
        get: () => {
          return this._value
        },
        set: (value) => {
          this._value = value
        }
      })
    }

    // Set initial value.
    if (params.value !== undefined) {
      this._value = params.value
    } else if (this._value === undefined && params.default !== undefined) {
      this._value = params.default
    }
  }

  // ===== Private properties ==================================================

  // True iff Characteristic value can be updated from HomeKit.
  get _isWriteable () {
    for (const p of this._characteristic.props.perms) {
      if (p === this.Characteristic.Perms.WRITE) {
        return true
      }
    }
    return false
  }
  //
  // // Prefix log messages with name of associated LibService.
  // get _namePrefix () {
  //   return this._parent._name ? this._parent._name + ': ' : ''
  // }

  // Cached value of associated Characteristic.
  get _value () {
    return this._context[this._key]
  }
  set _value (value) {
    // Check for valid value.
    if (!this._isValid(value)) {
      throw this.newError(
        '%j: invalid value for %s', value, this._characteristic.displayName
      )
    }

    // Issue info message that Characteristic value is updated by plugin.
    if (this._value === undefined) {
      this.log(
        'set %s to %s%s', this._characteristic.displayName,
        value, this._unit
      )
    } else {
      if (value === this._value) {
        return
      }
      this.log(
        'set %s from %s%s to %s%s', this._characteristic.displayName,
        this._value, this._unit, value, this._unit
      )
    }

    // Update persisted value in ~/.homebridge/accessories/cachedAccessories.
    this._context[this._key] = value

    // Update value of associated Characteristic.
    this._characteristic.updateValue(value)
  }

  // ===== Private methods =====================================================

  // Check whether value is valid.
  _isValid (value) {
    if (value === undefined || value === null) {
      return false
    }
    const props = this._characteristic.props
    if (props.minValue && value < props.minValue) {
      return false
    }
    if (props.maxValue && value > props.maxValue) {
      return false
    }
    // TODO: stepValue
    if (!props.validValues) {
      return true
    }

    for (const validValue of props.validValues) {
      if (value === validValue) {
        return true
      }
    }
    return false
  }
}
