// homebridge-lib/lib/ServiceDelegate/History/Consumption.js
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
    * @param {!CharacteristicDelegate} consumptionDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.TotalConsumption`
    * characteristic.
    * @param {?CharacteristicDelegate} powerDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.CurrentConsumption`
    * characteristic.
    */
  constructor (
    accessoryDelegate, params, consumptionDelegate, powerDelegate
  ) {
    super(accessoryDelegate, params)
    if (!(consumptionDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('consumptionDelegate: not a CharacteristicDelegate')
    }
    if (
      powerDelegate != null &&
      !(powerDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('powerDelegate: not a CharacteristicDelegate')
    }
    this.addCharacteristicDelegate({
      key: 'consumption',
      silent: true
    })
    this.addCharacteristicDelegate({
      key: 'time',
      silent: true
    })
    this._consumptionDelegate = consumptionDelegate
    this._powerDelegate = powerDelegate
    this._entry = { time: 0, power: 0 }
  }

  _addEntry () {
    const now = Math.round(new Date().valueOf() / 1000)
    // Sensor deliveres totalConsumption, optionally compute currentConsumption
    if (this.values.consumption != null && this.values.time != null) {
      const delta = this._consumptionDelegate.value - this.values.consumption // kWh
      const period = now - this.values.time // s
      const power = Math.round(1000 * 3600 * delta / period) // W
      if (this._powerDelegate != null) {
        this._powerDelegate.value = power
      }
      this._entry.power = power
      super._addEntry(now)
    }
    this.values.consumption = this._consumptionDelegate.value
    this.values.time = now
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

module.exports = Consumption
