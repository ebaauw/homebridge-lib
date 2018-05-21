// homebridge-lib/lib/LibService.js
//
// Library for homebridge plug-ins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.
//
// See https://github.com/ebaauw/homebridge-lib/wiki/LibService.

'use strict'

const LibCharacteristic = require('./LibCharacteristic')
const LibObject = require('./LibObject')

// Delegate for Service.
module.exports = class LibService extends LibObject {
  // ===== Constructor =========================================================

  constructor (parent, params) {
    super(parent._platform, params.name)
    const index = params.subtype
      ? [params.serviceName, params.subtype].join('.')
      : params.serviceName

    // Get or create associated Service.
    const Service = this.Service[params.serviceName]
    this._service = params.subtype
      ? parent._accessory.getServiceByUUIDAndSubType(Service, params.subtype)
      : parent._accessory.getService(Service)
    if (!this._service) {
      this._service = new Service(params.name, params.subtype)
      this._service = parent._accessory.addService(this._service)
      parent._accessory.context[index] = {}
    }
    this._service.displayName = params.name

    // Setup persisted storage in ~/.homebridge/accessories/cachedAccessories.
    this._context = parent._accessory.context[index]

    // Create associated Characteristic.Name.
    this._nameChar = new LibCharacteristic(this, {
      key: 'name',
      charName: 'Name',
      value: params.name
    })
  }

  // ===== Public properties ===================================================

  // Name of the associated Service.
  get name () {
    return this._context.name
  }
  set name (name) {
    // Update value of associated Characteristic.Name.
    this._nameChar._value = name
    // Prefix log messages with new name.
    this._name = this.name
    // Update name of associated Service.
    this._service.displayName = this.name
  }
}
