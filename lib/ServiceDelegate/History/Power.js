// homebridge-lib/lib/ServiceDelegate/History/Power.js
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
  * `resetTotal`     | `Characteristics.eve.ResetTotal`
  *
  * This delegate is for sensors that don't report life-time consumption. The
  * history from the value of the associated
  * `Characteristics.eve.CurrentConsumption` over time. It updates the value of
  * the associated `Characteristics.eve.TotalConsumption` characteristic.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Power extends History {
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
    * @param {?CharacteristicDelegate} params.onDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.On` characteristic.
    * @param {?CharacteristicDelegate} params.lastActivationDelegate - A
    * reference to the delegate of the associated
    * `Characteristics.eve.LastActivation` characteristic.
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
      throw new TypeError('params.onDelegate: not a CharacteristicDelegate')
    }
    if (
      params.lastActivationDelegate != null &&
      !(params.lastActivationDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('params.lastActivationDelegate: not a CharacteristicDelegate')
    }
    this._powerDelegate = params.powerDelegate
    this._consumptionDelegate = params.consumptionDelegate

    this.entry = { p: 0 }
    this._runningConsumption = 0 // 10-min-interval running value
    this._totalConsumption = params.consumptionDelegate.value // life-time value
    this._power = params.powerDelegate.value // current power
    this._time = History.now() // start time of current power
    params.powerDelegate.on('didSet', (value) => {
      const now = History.now()
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
    // Sensor delivers currentConsumption, compute totalConsumption
    if (this._time != null) {
      const delta = this._power * (entry.time - this._time) // Ws
      this._runningConsumption += delta / 60.0 // 0.1 W * 10 min
      this._totalConsumption += delta / 36000.0 // 0.01 kWh
      this._consumptionDelegate.value = Math.round(this._totalConsumption) / 100.0 // kWh
      entry.p = Math.round(this._runningConsumption) // 0.1 W * 10 min
    }
    super.addEntry(entry)
    this._power = this._powerDelegate.value
    this._time = entry.time
    this._runningConsumption = 0
  }

  get fingerPrint () { return '02 0702 0E01' }

  entryToBuffer (entry) {
    const buffer = Buffer.alloc(16)
    let mask = 0
    let o = 1
    if (entry.p != null) {
      mask |= 0x01
      buffer.writeUInt16LE(entry.p, o); o += 2
    }
    if (entry.o != null) {
      mask |= 0x02
      buffer.writeUInt8(entry.o, o); o += 1
    }
    buffer.writeUInt8(mask, 0)
    return buffer.slice(0, o)
  }
}

module.exports = Power
