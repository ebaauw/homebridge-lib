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
  constructor (libService, params = {}) {
    if (!(libService instanceof require('./LibService'))) {
      throw new TypeError(`libService: ${libService}: not a LibService`)
    }
    super(libService._platform, libService.name)
    if (
      typeof params.Characteristic !== 'function' ||
      typeof params.Characteristic.UUID !== 'string'
    ) {
      throw new TypeError(
        `params.Characteristic: ${params.Charracteristic}: not a Characteristic`
      )
    }
    if (typeof params.key !== 'string') {
      throw new TypeError(`params.key: ${params.key}: not a string`)
    }
    if (params.key === '') {
      throw new RangeError(`params.key: ${params.key}: invalid key`)
    }
    this._libService = libService
    this._key = params.key

    // Get or create associated Characteristic.
    const Characteristic = params.Characteristic
    this._libService._service.addOptionalCharacteristic(Characteristic)
    this._characteristic = this._libService._service.getCharacteristic(Characteristic)
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
    if (this._canWrite) {
      this._characteristic.on('set', this.didSet.bind(this))
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

  // Cached value of associated Characteristic.
  get value () {
    return this._libService._context[this._key]
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
    this._libService._context[this._key] = value

    // Update value of associated Characteristic.
    this._characteristic.updateValue(value)

    // Inform service delegate.
    this.emit('didSet', value)
  }

  // Called when Charateristic was set from HomeKit
  didSet (value, callback) {
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
    this._libService._context[this._key] = value

    // Inform service delegate.
    this.emit('didSet', value)

    // Return status to HomeKit.
    return callback()
  }
}
