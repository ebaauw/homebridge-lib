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

// Delegate for PlatformAccessory and for corresponding AccessoryInformation
// service.
module.exports = class LibAccessory extends homebridgeLib.LibObject {
  // ===== Constructor =========================================================

  constructor (platform, params = {}) {
    if (params.name == null) {
      throw new SyntaxError(`${params}: name missing`)
    }
    super(platform, params.name)
    if (params.id == null || typeof params.id !== 'string') {
      throw new TypeError(`params.id: ${params.id}: not a string`)
    }
    if (params.id === '') {
      throw new RangeError(`params.id: ${params.id}: invalid id`)
    }

    // Link or create associated PlatformAccessory.
    this._accessory = this._platform._getAccessory(this, params)
    this._context = this._accessory.context

    // Create delegate for AccessoryInformation service.
    this._libServiceInfo = new homebridgeLib.LibService.AccessoryInformation(
      this, params
    )

    // Configure PlatformAccessory.
    this._accessory.on('identify', this._identify.bind(this))
  }

  // Remove associated accessory from platform
  remove () {
    this._platform._removeAccessory(this._accessory)
  }
  // ===== Public properties ===================================================

  get name () {
    return super.name
  }
  set name (name) {
    super.name = name
    if (this._accessory != null) {
      this._accessory.displayName = name
    }
    if (this._libServiceInfo != null) {
      this._libServiceInfo.displayName = name
    }
  }

  // Persisted storage in ~/.homebridge/accessories/cachedAccessories.
  get context () {
    return this._context.context
  }

  get className () {
    return this.constructor.name
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
