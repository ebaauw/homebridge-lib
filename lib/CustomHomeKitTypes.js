// homebridge-lib/lib/CustomeHomeKitTypes.js
//
// Library for homebridge plug-ins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.
//
// Custom HomeKit Services and Characteristics.

const util = require('util')

let hap

// Abstract supertype for holding custom HomeKit Services and Characteristics.
module.exports = class CustomHomeKitTypes {
  constructor (homebridge, my) {
    hap = homebridge.hap
    this.formats = homebridge.hap.Characteristic.Formats
    this.perms = homebridge.hap.Characteristic.Perms
    this.units = homebridge.hap.Characteristic.Units
    this.Service = my.Service
    this.Characteristic = my.Characteristic
  }

  // Return HAP long uuid for id.
  uuid (id) {
    if (typeof id !== 'string' || id.length !== 3) {
      throw new TypeError(`${id}: illegal id`)
    }
    return `00000${id}-0000-1000-8000-0026BB765291`
  }

  // Create a custom Characteristic.
  createCharacteristic (name, uuid, props, displayName = name) {
    this.Characteristic[name] = function () {
      hap.Characteristic.call(this, displayName, uuid)
      this.setProps(props)
      this.value = this.getDefaultValue()
    }
    util.inherits(this.Characteristic[name], hap.Characteristic)
    this.Characteristic[name].UUID = uuid
  }

  // Create a custom Service.
  createService (name, uuid, Characteristics, OptionalCharacteristics = []) {
    this.Service[name] = function (displayName, subtype) {
      hap.Service.call(this, displayName, uuid, subtype)
      for (const Characteristic of Characteristics) {
        this.addCharacteristic(Characteristic)
      }
      for (const Characteristic of OptionalCharacteristics) {
        this.addOptionalCharacteristic(Characteristic)
      }
    }
    util.inherits(this.Service[name], hap.Service)
    this.Service[name].UUID = uuid
  }
}
