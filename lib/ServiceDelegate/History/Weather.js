// homebridge-lib/lib/ServiceDelegate/History/Weather.js
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

/** Class for an Eve Weather _History_ service delegate.
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
  * `Characteristics.eve.AirPressure` characteristics.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Weather extends ServiceDelegate.History {
  /** Create a new instance of an Eve Weather _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} params.temperatureDelegate - A reference
    * to the delegate of the associated `Characteristics.hap.CurrentTemperature`
    * characteristic.
    * @param {?CharacteristicDelegate} params.humidityDelegate - A reference
    * to the delegate of the associated
    * `Characteristics.hap.CurrentRelativeHumidity` characteristic.
    * @param {?CharacteristicDelegate} params.airPressureDelegate - A reference to
    * the delegate of the associated `Characteristics.eve.AirPressure`
    * characteristic.
    */
  constructor (accessoryDelegate, params) {
    super(accessoryDelegate, params)
    if (!(params.temperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.temperatureDelegate: not a CharacteristicDelegate')
    }
    if (
      params.humidityDelegate != null &&
      !(params.humidityDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('params.humidityDelegate: not a CharacteristicDelegate')
    }
    if (
      params.airPressureDelegate != null &&
      !(params.airPressureDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('params.airPressureDelegate: not a CharacteristicDelegate')
    }
    this._entry = {
      time: 0,
      temp: params.temperatureDelegate.value
    }
    params.temperatureDelegate.on('didSet', (value) => {
      this._entry.temp = value
    })
    if (params.humidityDelegate != null) {
      this._entry.humidity = params.humidityDelegate.value
      params.humidityDelegate.on('didSet', (value) => {
        this._entry.humidity = value
      })
      if (params.airPressureDelegate != null) {
        this._entry.pressure = params.airPressureDelegate.value
        params.airPressureDelegate.on('didSet', (value) => {
          this._entry.pressure = value
        })
      }
    }
  }

  get _fingerPrint () { return '03 0102 0202 0302' }

  _entryStream (entry) {
    if (entry.humidity == null) {
      return util.format(
        '|0c %s %s 01 %s',
        numToHex(swap32(this._h.currentEntry), 8),
        numToHex(swap32(entry.time - this._h.initialTime), 8),
        numToHex(swap16(entry.temp * 100), 4)
      )
    }
    if (entry.pressure == null) {
      return util.format(
        '|0e %s %s 03 %s %s',
        numToHex(swap32(this._h.currentEntry), 8),
        numToHex(swap32(entry.time - this._h.initialTime), 8),
        numToHex(swap16(entry.temp * 100), 4),
        numToHex(swap16(entry.humidity * 100), 4)
      )
    }
    return util.format(
      '|10 %s %s 07 %s %s %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.initialTime), 8),
      numToHex(swap16(entry.temp * 100), 4),
      numToHex(swap16(entry.humidity * 100), 4),
      numToHex(swap16(entry.pressure * 10), 4)
    )
  }
}

module.exports = Weather
