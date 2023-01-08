// homebridge-lib/lib/ServiceDelegate/History/Consumption.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2023 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../../../index')

const { History } = homebridgeLib.ServiceDelegate

/** Class for an Eve Energy _History_ service delegate.
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
  * This delegate is for sensors that report life-time consumption. The history
  * is computed from the changes to the value of the associated
  * `Characteristics.eve.TotalConsumption` characteristic. If the sensor doesn't
  * also report power, this delegate can update the the value of the associated
  * `Characteristics.eve.CurrentConsumption` characteristic.
  *
  * Note that the key in the history entry is called `power`, but its value
  * is the consumption in Wh since the previous entry.
  *
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Consumption extends History {
  /** Create a new instance of an Eve Energy _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} params.consumptionDelegate - A reference
    * to the delegate of the associated `Characteristics.eve.TotalConsumption`
    * characteristic.
    * @param {?CharacteristicDelegate} params.powerDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.CurrentConsumption`
    * characteristic.
    * @param {?CharacteristicDelegate} params.onDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.On` characteristic.
    * @param {?CharacteristicDelegate} params.lastActivationDelegate - A
    * reference to the delegate of the associated
    * `Characteristics.eve.LastActivation` characteristic.
    */
  constructor (accessoryDelegate, params = {}) {
    super(accessoryDelegate, params)
    if (!(params.consumptionDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.consumptionDelegate: not a CharacteristicDelegate')
    }
    if (
      params.powerDelegate != null &&
      !(params.powerDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('params.powerDelegate: not a CharacteristicDelegate')
    }
    if (
      params.onDelegate != null &&
      !(params.onDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('params.onDelegate: not a CharacteristicDelegate')
    }
    if (
      params.lastActivationDelegate != null &&
      !(params.lastActivationDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('params.lastActivationDelegate: not a CharacteristicDelegate')
    }
    this._consumptionDelegate = params.consumptionDelegate
    this._powerDelegate = params.powerDelegate

    this.entry = { p: 0 }
    if (params.onDelegate != null) {
      this.entry.o = params.onDelegate.value ? 1 : 0
      params.onDelegate.on('didSet', (value) => {
        const now = History.now()
        if (params.lastActivationDelegate != null) {
          params.lastActivationDelegate.value = this.lastActivationValue(now)
        }
        this.entry.o = value ? 1 : 0
        super.addEntry({ time: now, o: this.entry.o })
      })
    }
  }

  addEntry (entry) {
    // Sensor deliveres totalConsumption, optionally compute currentConsumption
    if (this._consumption != null && this._time != null) {
      const delta = this._consumptionDelegate.value - this._consumption // kWh
      const period = entry.time - this._time // s
      const power = 1000 * 3600 * delta / period // W
      if (this._powerDelegate != null) {
        this._powerDelegate.value = Math.round(power) // W
      }
      entry.p = Math.round(power * 10) // 0.1 W * 10 min
    }
    super.addEntry(entry)
    this._consumption = this._consumptionDelegate.value
    this._time = entry.time
  }

  get fingerPrint () { return '02 0702 0E01' }

  entryToBuffer (entry) {
    const buffer = Buffer.alloc(4)
    let o = 0
    if (entry.o == null) {
      buffer.writeUInt8(0x01, o); o += 1
      buffer.writeUInt16LE(entry.p, o); o += 2
      return buffer.slice(0, o)
    }
    if (entry.p == null) {
      buffer.writeUInt8(0x02, o); o += 1
      buffer.writeUInt8(entry.o, o); o += 1
      return buffer.slice(0, o)
    }
    buffer.writeUInt8(0x03, o); o += 1
    buffer.writeUInt16LE(entry.p, o); o += 2
    buffer.writeUInt8(entry.o, o); o += 1
    return buffer.slice(0, o)
  }
}

module.exports = Consumption
