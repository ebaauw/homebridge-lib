// homebridge-lib/lib/CustomeHomeKitTypes.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2019 Erik Baauw. All rights reserved.
//
// Custom HomeKit Services and Characteristics.

const util = require('util')

let hap

// Return HAP long uuid for id.
// function uuid (id) {
//   if (typeof id !== 'string' || id.length !== 3) {
//     throw new TypeError(`${id}: illegal id`)
//   }
//   return `00000${id}-0000-1000-8000-0026BB765291`
// }

/**
 * Abstract superclass for custom HomeKit Services and Characteristics.
 * @abstract
 */
class CustomHomeKitTypes {
  constructor (homebridge) {
    hap = homebridge.hap
    this.formats = hap.Characteristic.Formats
    this.perms = hap.Characteristic.Perms
    this.units = hap.Characteristic.Units
    this.Service = {}
    this.Characteristic = {}
  }

  /**
   * Create a custom Characteristic in CustomHomeKitTypes#Characteristic
   * @param {!string} name - Name.
   * @param {!string} uuid - UUID.
   * @param {object} props - Properties.
   * @param {string} [displayName=name] - Name displayed in HomeKit apps.
   */
  createCharacteristic (name, uuid, props, displayName = name) {
    this.Characteristic[name] = function () {
      hap.Characteristic.call(this, displayName, uuid)
      this.setProps(props)
      this.value = this.getDefaultValue()
    }
    util.inherits(this.Characteristic[name], hap.Characteristic)
    this.Characteristic[name].UUID = uuid
  }

  /**
   * Create a custom Service.
   * @param {!string} name - Name.
   * @param {!string} uuid - UUID.
   * @param {Charactertistic[]} Characteristics - Characteristics.
   * @param {Charactertistic[]} [OptionalCharacteristics=[]] - Optional Characteristics.
   */
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

module.exports = CustomHomeKitTypes
