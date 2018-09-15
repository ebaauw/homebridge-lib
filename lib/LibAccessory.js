// homebridge-lib/lib/LibAccessory.js
//
// Library for homebridge plug-ins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.
//
// See https://github.com/ebaauw/homebridge-lib/wiki/LibAccessory.

'use strict'

const homebridgeLib = {
  LibCharacteristic: require('./LibCharacteristic'),
  LibObject: require('./LibObject'),
  LibService: require('./LibService')
}

// Characteristics for the associated hap.Service.AccessoryInformation.
const characteristics = {
  name: { name: 'Name' },
  id: { name: 'SerialNumber' },
  manufacturer: { name: 'Manufacturer' },
  model: { name: 'Model' },
  firmware: { name: 'FirmwareRevision' },
  hardware: { name: 'HardwareRevision', isOptional: true },
  software: { name: 'SoftwareRevision', isOptional: true }
}

// Delegate for PlatformAccessory and for corresponding AccessoryInformation
// service.
module.exports = class LibAccessory extends homebridgeLib.LibObject {
  // ===== Constructor =========================================================

  constructor (platform, params) {
    if (!(platform instanceof require('./LibPlatform'))) {
      throw new TypeError(`${platform}: not a LibPlatform`)
    }
    if (params == null || params.name == null) {
      throw new SyntaxError(`params.name: missing`)
    }
    if (params.id == null || typeof params.id !== 'string') {
      throw new TypeError(`${params.id}: not a string`)
    }
    if (params.id === '') {
      throw new RangeError(`${params.id}: invalid accessory id`)
    }
    super(platform, params.name)

    // Link or create associated PlatformAccessory.
    this._accessory = this._platform._getAccessory(params)
    if (this._accessory == null) {
      params.className = this.constructor.name
      this._accessory = this._platform._createAccessory(params)
    }
    this._context = this._accessory.context

    // Setup associated Service.AccessoryInformation.
    this._service = this._accessory.getService(
      this.hap.Service.AccessoryInformation
    )
    this._service.displayName = params.name
    this._libCharacteristics = {}
    for (const key in characteristics) {
      if (!characteristics[key].isOptional || params[key]) {
        this._libCharacteristics[key] = new homebridgeLib.LibCharacteristic(
          this, {
            charName: characteristics[key].name,
            key: key,
            value: params[key]
          }
        )
      }
    }
    // Configure PlatformAccessory.
    this._accessory.updateReachability(true)
    this._accessory.on('identify', this._identify.bind(this))
  }

  // Remove associated accessory from platform
  remove () {
    this._platform._removeAccessory(this._accessory)
  }
  // ===== Public properties ===================================================

  set name (name) {
    super.name = name
    if (this._accessory != null) {
      this._accessory.displayName = name
    }
    if (this._service != null) {
      this._service.displayName = name
    }
  }

  // Persisted storage in ~/.homebridge/accessories/cachedAccessories.
  get context () {
    return this._context.context
  }

  // ===== Public methods ======================================================

  getService (service) {
    return this._accessory.getService(service)
  }

  addService (service) {
    this._accessory.addService(service)
  }

  deleteService (service) {
    this._accessory.removeService(service)
  }

  // ===== Private methods =====================================================

  // Called by homebridge when Identify is selected.
  _identify (paired, callback) {
    this.log('identify')
    this.emit('identify')
    this.debug('context: %j', this._context)
    callback()
  }
}
