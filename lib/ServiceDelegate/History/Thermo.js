// homebridge-lib/lib/ServiceDelegate/History/Thermo.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2022 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../../../index')

const { History } = homebridgeLib.ServiceDelegate

/** Class for an Eve Thermo _History_ service delegate.
  *
  * This delegate sets up a `Services.eve.History` HomeKit service
  * with keys for the following HomeKit characteristics:
  *
  * key              | Characteristic
  * ---------------- | ----------------------------------
  * `name`           | `Characteristics.hap.Name`
  * `historyRequest` | `Characteristics.eve.HistoryRequest`
  * `setTime`        | `Characteristics.eve.SetTime`
  * `historyStatus`  | `Characteristics.eve.HistoryStatus`
  * `historyEntries` | `Characteristics.eve.HistoryEntries`
  *
  * This delegate creates the history from the associated
  * `Characteristics.hap.CurrentTemperature`,
  * `Characteristics.hap.TargetTemperature`, and
  * `Characteristics.eve.ValvePosition` characteristics.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Thermo extends History {
  /** Create a new instance of an Eve Thermo _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} params.temperatureDelegate - A reference
    * to the delegate of the associated `Characteristics.hap.CurrentTemperature`
    * characteristic.
    * @param {!CharacteristicDelegate} params.targetTemperatureDelegate - A
    * reference to the delegate of the associated
    * `Characteristics.hap.TargetTemperature` characteristic.
    * @param {!CharacteristicDelegate} params.valvePositionDelegate - A
    * reference to the delegate of the associated
    * `Characteristics.eve.ValvePosition` characteristic.
    */
  constructor (accessoryDelegate, params) {
    super(accessoryDelegate, params)
    if (!(params.temperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.temperatureDelegate: not a CharacteristicDelegate')
    }
    if (!(params.targetTemperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.targetTemperatureDelegate: not a CharacteristicDelegate')
    }
    if (!(params.valvePositionDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.valvePositionDelegate: not a CharacteristicDelegate')
    }
    this.entry = {
      t: params.temperatureDelegate.value,
      s: params.targetTemperatureDelegate.value,
      v: params.valvePositionDelegate.value
    }
    params.temperatureDelegate.on('didSet', (value) => {
      this.entry.t = value
    })
    params.targetTemperatureDelegate.on('didSet', (value) => {
      this.entry.s = value
    })
    params.valvePositionDelegate.on('didSet', (value) => {
      this.entry.v = value
    })
  }

  get fingerPrint () { return '03 0102 1102 1001' }

  entryToBuffer (entry) {
    const buffer = Buffer.alloc(6)
    let o = 0
    buffer.writeUInt8(0x07, o); o += 1
    buffer.writeUInt16LE(entry.t * 100, o); o += 2
    buffer.writeUInt16LE(entry.s * 100, o); o += 2
    buffer.writeUInt8(entry.v, o); o += 1
    return buffer.slice(0, o)
  }
}

module.exports = Thermo
