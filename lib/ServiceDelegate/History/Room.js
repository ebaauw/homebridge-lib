// homebridge-lib/lib/ServiceDelegate/History/Room.js
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

/** Class for an Eve Room _History_ service delegate.
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
  * `Characteristics.hap.CurrentRelativeHumidity`, and
  * `Characteristics.hap.VOCDensity` characteristics.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Room extends ServiceDelegate.History {
  /** Create a new instance of an Eve Weather _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} temperatureDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.CurrentTemperature`
    * characteristic.
    * @param {?CharacteristicDelegate} humidityDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.CurrentRelativeHumidity`
    * characteristic.
    * @param {?CharacteristicDelegate} vocDensityDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.AirPressure`
    * characteristic.
    */
  constructor (
    accessoryDelegate, params,
    temperatureDelegate, humidityDelegate, vocDensityDelegate
  ) {
    super(accessoryDelegate, params)
    if (!(temperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('temperatureDelegate: not a CharacteristicDelegate')
    }
    if (
      humidityDelegate != null &&
      !(humidityDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('humidityDelegate: not a CharacteristicDelegate')
    }
    if (
      vocDensityDelegate != null &&
      !(vocDensityDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('vocDensityDelegate: not a CharacteristicDelegate')
    }
    this._entry = {
      time: 0,
      temp: temperatureDelegate.value,
      humidity: 0,
      voc: 0
    }
    temperatureDelegate.on('didSet', (value) => {
      this._entry.temp = value
    })
    if (humidityDelegate != null) {
      this._entry.humidity = humidityDelegate.value
      humidityDelegate.on('didSet', (value) => {
        this._entry.humidity = value
      })
      if (vocDensityDelegate != null) {
        this._entry.voc = vocDensityDelegate.value
        vocDensityDelegate.on('didSet', (value) => {
          this._entry.voc = value
        })
      }
    }
  }

  get _fingerPrint () {
    // return '07 0102 0202 2202 2901 2501 2302 2801'
    return '03 0102 0202 2202'
  }

  _entryStream (entry) {
    return util.format(
      '|10 %s %s 07 %s %s %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.initialTime), 8),
      numToHex(swap16(entry.temp * 100), 4),
      numToHex(swap16(entry.humidity * 100), 4),
      numToHex(swap16(entry.voc), 4)
    )
  }
}

module.exports = Room
