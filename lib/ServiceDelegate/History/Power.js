// homebridge-lib/lib/ServiceDelegate/History/Power.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2022 Erik Baauw. All rights reserved.
//
// The logic for handling Eve history was copied from Simone Tisa's
// fakagato-history repository, copyright © 2017 simont77.
// See https://github.com/simont77/fakegato-history.

'use strict'

const homebridgeLib = require('../../../index')

const { ServiceDelegate } = homebridgeLib

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
  * `resetTotal`     | `Characteristics.eve.ResetTotal`
  *
  * This delegate is for sensors that don't report life-time consumption. The
  * history from the value of the associated
  * `Characteristics.eve.CurrentConsumption` over time. It updates the value of
  * the associated `Characteristics.eve.TotalConsumption` characteristic.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Power extends ServiceDelegate.History {
  /** Create a new instance of an Eve Energy _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} params.powerDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.CurrentConsumption`
    * characteristic.
    * @param {!CharacteristicDelegate} params.consumptionDelegate - A reference
    * to the delegate of the associated `Characteristics.eve.TotalConsumption`
    * characteristic.
    * @param {!CharacteristicDelegate} params.onDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.On` characteristic.
    */
  constructor (accessoryDelegate, params) {
    super(accessoryDelegate, params)
    if (!(params.powerDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.powerDelegate: not a CharacteristicDelegate')
    }
    if (!(params.consumptionDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.consumptionDelegate: not a CharacteristicDelegate')
    }
    if (
      params.onDelegate != null &&
      !(params.onDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('params.temperatureDelegate: not a CharacteristicDelegate')
    }
    this._powerDelegate = params.powerDelegate
    this._consumptionDelegate = params.consumptionDelegate
    this._entry = { time: 0, p: 0 }
    this._runningConsumption = 0 // 10-min-interval running value
    this._totalConsumption = params.consumptionDelegate.value // life-time value
    params.powerDelegate.on('didSet', (value) => {
      const now = Math.round(new Date().valueOf() / 1000)
      if (this._time != null) {
        const delta = this._power * (now - this._time) // Ws
        this._runningConsumption += Math.round(delta / 60.0) // 0.1W * 10 min
        this._totalConsumption += delta / 36000.0 // 0.01 kWh
      }
      this._power = value
      this._time = now
    })
    this.addCharacteristicDelegate({
      key: 'resetTotal',
      Characteristic: this.Characteristics.eve.ResetTotal,
      value: params.resetTotal
    }).on('didSet', (value) => {
      this._runningConsumption = 0
      this._totalConsumption = 0
      this._consumptionDelegate.value = this._totalConsumption
    })
    if (params.onDelegate != null) {
      this._entry.o = params.onDelegate.value ? 1 : 0
      params.onDelegate.on('didSet', (value) => {
        const now = Math.round(new Date().valueOf() / 1000)
        if (params.lastActivationDelegate != null) {
          params.lastActivationDelegate.value = this.now
        }
        this._entry.o = value ? 1 : 0
        const p = this._entry.p
        delete this._entry.p
        super._addEntry(now)
        this._entry.p = p
      })
    }
  }

  _addEntry () {
    const now = Math.round(new Date().valueOf() / 1000)
    // Sensor delivers currentConsumption, compute totalConsumption
    if (this._time != null) {
      const delta = this._power * (now - this._time) // Ws
      this._runningConsumption += delta / 60.0 // 0.1 W * 10 min
      this._totalConsumption += delta / 36000.0 // 0.01 kWh
      this._consumptionDelegate.value = Math.round(this._totalConsumption) / 100.0 // kWh
      this._entry.p = Math.round(this._runningConsumption) // 0.1 W * 10 min
      super._addEntry(now)
    } else if (this._entry.o != null) {
      super._addEntry(now)
    }
    this._power = this._powerDelegate.value
    this._time = now
    this._runningConsumption = 0
  }

  get _fingerPrint () { return '02 0702 0E01' }

  _entryToBuffer (entry) {
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

module.exports = Power
