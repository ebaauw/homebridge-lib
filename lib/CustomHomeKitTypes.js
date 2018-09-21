// homebridge-lib/lib/CustomeHomeKitTypes.js
//
// Library for homebridge plug-ins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.
//
// Custom HomeKit Services and Characteristics.

const util = require('util')

const context = {
  Service: {},
  Characteristic: {}
}

let hap

// Return HAP long uuid for id.
// function uuid (id) {
//   if (typeof id !== 'string' || id.length !== 3) {
//     throw new TypeError(`${id}: illegal id`)
//   }
//   return `00000${id}-0000-1000-8000-0026BB765291`
// }

// Abstract supertype for holding custom HomeKit Services and Characteristics.
module.exports = class CustomHomeKitTypes {
  constructor (homebridge) {
    hap = homebridge.hap
    this.formats = hap.Characteristic.Formats
    this.perms = hap.Characteristic.Perms
    this.units = hap.Characteristic.Units
  }

  get Service () {
    return context.Service
  }

  get Characteristic () {
    return context.Characteristic
  }

  // Create a custom Characteristic.
  createCharacteristic (name, uuid, props, displayName = name) {
    context.Characteristic[name] = function () {
      hap.Characteristic.call(this, displayName, uuid)
      this.setProps(props)
      this.value = this.getDefaultValue()
    }
    util.inherits(context.Characteristic[name], hap.Characteristic)
    context.Characteristic[name].UUID = uuid
  }

  // Create a custom Service.
  createService (name, uuid, Characteristics, OptionalCharacteristics = []) {
    context.Service[name] = function (displayName, subtype) {
      hap.Service.call(this, displayName, uuid, subtype)
      for (const Characteristic of Characteristics) {
        this.addCharacteristic(Characteristic)
      }
      for (const Characteristic of OptionalCharacteristics) {
        this.addOptionalCharacteristic(Characteristic)
      }
    }
    util.inherits(context.Service[name], hap.Service)
    context.Service[name].UUID = uuid
  }
}
