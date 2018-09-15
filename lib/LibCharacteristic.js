// homebridge-lib/lib/LibCharacteristic.js
//
// Library for homebridge plug-ins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.
//
// See https://github.com/ebaauw/homebridge-lib/wiki/LibCharacteristic.

'use strict'

const homebridgeLib = {
  LibObject: require('./LibObject')
}

// Delegate for Characteristic.
module.exports = class LibCharacteristic extends homebridgeLib.LibObject {
  // ===== Constructor =========================================================

  constructor (parent, params) {
    if (!(
      parent instanceof require('./LibService') ||
      parent instanceof require('./LibAccessory')
    )) {
      throw new TypeError(`${parent}: not a LibService or LibAccessory`)
    }
    super(parent._platform, parent.name)
    this._parent = parent
    this._values = parent._context.values
    this._key = params.key
    this._unit = params.unit || ''

    // Get or create associated Characteristic.
    const Char = this.hap.Characteristic[params.charName]
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
        this._values[this._key] = value
        parent.emit('didSet', this._key, value)
        return callback()
      })
    }

    // Set initial value.
    if (params.value !== undefined) {
      this.value = params.value
    } else if (this._value === undefined && params.default !== undefined) {
      this._value = params.default
    }
  }

  // ===== Private properties ==================================================

  // True iff Characteristic value can be updated fro HomeKit.
  get _isWriteable () {
    return this._characteristic.props.perms.includes(
      this.hap.Characteristic.Perms.WRITE
    )
  }

  // Cached value of associated Characteristic.
  get value () {
    return this._values[this._key]
  }
  set value (value) {
    // Issue info message that Characteristic value is updated by plugin.
    if (this.value == null) {
      this.log(
        'set %s to %s%s', this._characteristic.displayName,
        value, this._unit
      )
    } else if (this._characteristic.eventOnlyCharacteristic) {
      this.log('%s %s', this._characteristic.displayName, value)
    } else {
      if (value === this.value) {
        return
      }
      this.log(
        'set %s from %s%s to %s%s', this._characteristic.displayName,
        this.value, this._unit, value, this._unit
      )
    }

    // Update persisted value in ~/.homebridge/accessories/cachedAccessories.
    this._values[this._key] = value

    // Update value of associated Characteristic.
    this._characteristic.updateValue(value)
  }
}
