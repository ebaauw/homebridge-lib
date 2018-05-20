// homebridge-lib/lib/LibAccessory.js
//
// Library for homebridge plug-ins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.
//
// See https://github.com/ebaauw/homebridge-lib/wiki/LibAccessory.

'use strict'

const LibObject = require('./LibObject')
const LibCharacteristic = require('./LibCharacteristic')

// Characteristics for the associated Service.AccessoryInformation.
const characteristics = {
  name: {name: 'Name'},
  id: {name: 'SerialNumber'},
  manufacturer: {name: 'Manufacturer'},
  model: {name: 'Model'},
  firmware: {name: 'FirmwareRevision'},
  hardware: {name: 'HardwareRevision', isOptional: true},
  software: {name: 'SoftwareRevision', isOptional: true}
}

// Delegate for PlatformAccessory.
module.exports = class LibAccessory extends LibObject {
  // ===== Constructor =========================================================

  constructor (platform, params = {}) {
    super(platform, params.name)

    // Get or create associated PlatformAccessory.
    this._accessory = this._platform._getAccessory(params)
    if (this._accessory) {
      this.debug('link restored %s %s', this.constructor.name, params.id)
    } else {
      this.debug('create %s %s', this.constructor.name, params.id)
      this._accessory = new this.PlatformAccessory(
        params.name,
        this._platform._homebridge.hap.uuid.generate(params.id).toUpperCase(),
        params.category
      )
      this._accessory = this._platform._registerAccessory(
        params, this._accessory
      )
      this._accessory.context = {
        className: this.constructor.name
      }
    }
    this._context = this._accessory.context
    this._accessory.displayName = params.name

    // Setup associated Service.AccessoryInformation.
    this._service = this._accessory.getService(
      this.Service.AccessoryInformation
    )
    this._service.displayName = params.name
    this._libCharacteristics = {}
    for (const key in characteristics) {
      if (!characteristics[key].isOptional || params[key]) {
        this._libCharacteristics[key] = new LibCharacteristic(this, {
          charName: characteristics[key].name,
          key: key,
          value: params[key]
        })
      }
    }
    // Configure PlatformAccessory.
    this._accessory.updateReachability(true)
    this._accessory.on('identify', this._onIdentify.bind(this))
  }

  // ===== Public properties ===================================================

  // Name of the associated PlatformAccessory.
  get name () {
    return this._context.name
  }
  set name (name) {
    // Update value of associated Characteristic.Name.
    this._libCharacteristics.name._value = name
    // Prefix log messages with new name.
    this._name = this.name
    // Update name of associated Service.AccessoryInformation.
    this._service.displayName = this.name
    // Update name of associated PlatformAccessory.
    this._accessory.displayName = this.name
  }

  // Persisted storage in ~/.homebridge/accessories/cachedAccessories.
  get context () {
    this._context.context = this._context.context || {}
    return this._context.context
  }

  // ===== Public methods ======================================================

  getService (service) {
    return this._accessory.getService(service)
  }

  addService (service) {
    this._accessory.addService(service)
  }

  // ===== Private methods =====================================================

  // Called by homebridge when Identify is selected.
  _onIdentify (paired, callback) {
    this.log('identify')
    this.emit('identify')
    this.debug('context: %j', this._context)
    callback()
  }
}
