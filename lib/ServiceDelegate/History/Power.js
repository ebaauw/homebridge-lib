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
const util = require('util')

const { ServiceDelegate } = homebridgeLib
const { History } = ServiceDelegate
const { swap16, swap32, numToHex } = History

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
    * @param {!CharacteristicDelegate} powerDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.CurrentConsumption`
    * characteristic.
    * @param {!CharacteristicDelegate} consumptionDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.TotalConsumption`
    * characteristic.
    */
  constructor (
    accessoryDelegate, params,
    powerDelegate, consumptionDelegate
  ) {
    super(accessoryDelegate, params)
    if (!(powerDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('powerDelegate: not a CharacteristicDelegate')
    }
    if (!(consumptionDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('consumptionDelegate: not a CharacteristicDelegate')
    }
    this._powerDelegate = powerDelegate
    this._consumptionDelegate = consumptionDelegate
    this._entry = { time: 0, power: 0 }
    this._runningConsumption = 0 // 10-min-interval running value
    this._totalConsumption = consumptionDelegate.value // life-time value
    powerDelegate.on('didSet', (value) => {
      const now = Math.round(new Date().valueOf() / 1000)
      if (this._time != null) {
        const delta = this._power * (now - this._time) // Ws
        this._runningConsumption += Math.round(delta / 600.0) // W * 10 min
        this._totalConsumption += Math.round(delta / 3600.0) // Wh
      }
      this._power = value
      this._time = now
    })
    this.addCharacteristicDelegate({
      key: 'resetTotal',
      Characteristic: this.Characteristics.eve.ResetTotal,
      value: params.resetTotal
    })
    this._characteristicDelegates.resetTotal.on('didSet', (value) => {
      this._runningConsumption = 0
      this._totalConsumption = 0
      this._consumptionDelegate.value = this._totalConsumption
    })
  }

  _addEntry () {
    // Sensor delivers currentConsumption, compute totalConsumption
    const now = Math.round(new Date().valueOf() / 1000)
    if (this._time != null) {
      const delta = this._power * (now - this._time) // Ws
      this._runningConsumption += Math.round(delta / 600.0) // W * 10 min
      this._totalConsumption += Math.round(delta / 3600.0) // Wh
      this._consumptionDelegate.value = this._totalConsumption
      this._entry.power = this._runningConsumption
      super._addEntry(now)
    }
    this._power = this._powerDelegate.value
    this._time = now
    this._runningConsumption = 0
  }

  // get _fingerPrint () { return '04 0102 0202 0702 0f03' }
  get _fingerPrint () { return '01 0702' }

  _entryStream (entry) {
    return util.format(
      // '|14 %s %s 1f 0000 0000 %s 0000 0000',
      '|0c %s %s 01 %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.initialTime), 8),
      numToHex(swap16(entry.power * 10), 4)
    )
  }
}

module.exports = Power
