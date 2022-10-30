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
    * @param {!CharacteristicDelegate} onDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.On` characteristic.
    */
  constructor (
    accessoryDelegate, params, consumptionDelegate, powerDelegate, onDelegate
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
    if (
      onDelegate != null &&
      !(onDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('temperatureDelegate: not a CharacteristicDelegate')
    }
    this._consumptionDelegate = consumptionDelegate
    this._powerDelegate = powerDelegate
    this._entry = { time: 0, power: 0 }
    if (onDelegate != null) {
      this._entry.on = onDelegate.value ? 1 : 0
      onDelegate.on('didSet', (value) => {
        this._entry.on = value ? 1 : 0
        const power = this._entry.power
        this._entry.power = null
        super._addEntry()
        this._entry.power = power
      })
    }
  }

  _addEntry () {
    const now = Math.round(new Date().valueOf() / 1000)
    // Sensor deliveres totalConsumption, optionally compute currentConsumption
    if (this._consumption != null && this._time != null) {
      const delta = this._consumptionDelegate.value - this._consumption // kWh
      const period = now - this._time // s
      const power = 1000 * 3600 * delta / period // W
      if (this._powerDelegate != null) {
        this._powerDelegate.value = Math.round(power) // W
      }
      this._entry.power = Math.round(power * 10) // 0.1 W * 10 min
      super._addEntry(now)
    }
    this._consumption = this._consumptionDelegate.value
    this._time = now
  }

  get _fingerPrint () { return '02 0702 0E01' }

  _entryStream (entry) {
    if (entry.on == null) {
      return util.format(
        '|0c %s %s 01 %s',
        numToHex(swap32(this._h.currentEntry), 8),
        numToHex(swap32(entry.time - this._h.initialTime), 8),
        numToHex(swap16(entry.power), 4)
      )
    }
    if (entry.power == null) {
      return util.format(
        '|0b %s %s 02 %s',
        numToHex(swap32(this._h.currentEntry), 8),
        numToHex(swap32(entry.time - this._h.initialTime), 8),
        numToHex(entry.on, 2)
      )
    }
    return util.format(
      '|0d %s %s 03 %s %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.initialTime), 8),
      numToHex(swap16(entry.power), 4),
      numToHex(entry.on, 2)
    )
  }
}

module.exports = Consumption
