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

const { ServiceDelegate } = homebridgeLib

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
      t: params.temperatureDelegate.value
    }
    params.temperatureDelegate.on('didSet', (value) => {
      this._entry.t = value
    })
    if (params.humidityDelegate != null) {
      this._entry.h = params.humidityDelegate.value
      params.humidityDelegate.on('didSet', (value) => {
        this._entry.h = value
      })
      if (params.airPressureDelegate != null) {
        this._entry.p = params.airPressureDelegate.value
        params.airPressureDelegate.on('didSet', (value) => {
          this._entry.p = value
        })
      }
    }
  }

  get _fingerPrint () { return '03 0102 0202 0302' }

  _writeEntry (buffer, offset, entry) {
    let o = offset
    if (entry.h == null) {
      buffer.writeUInt8(12, o); o += 1
      buffer.writeUInt32LE(this._h.currentEntry, o); o += 4
      buffer.writeUInt32LE(entry.time - this._h.initialTime, o); o += 4
      buffer.writeUInt8(0x01, o); o += 1
      buffer.writeUInt16LE(entry.t * 100, o); o += 2
      return o
    }
    if (entry.p == null) {
      buffer.writeUInt8(14, o); o += 1
      buffer.writeUInt32LE(this._h.currentEntry, o); o += 4
      buffer.writeUInt32LE(entry.time - this._h.initialTime, o); o += 4
      buffer.writeUInt8(0x03, o); o += 1
      buffer.writeUInt16LE(entry.t * 100, o); o += 2
      buffer.writeUInt16LE(entry.h * 100, o); o += 2
      return o
    }
    buffer.writeUInt8(16, o); o += 1
    buffer.writeUInt32LE(this._h.currentEntry, o); o += 4
    buffer.writeUInt32LE(entry.time - this._h.initialTime, o); o += 4
    buffer.writeUInt8(0x07, o); o += 1
    buffer.writeUInt16LE(entry.t * 100, o); o += 2
    buffer.writeUInt16LE(entry.h * 100, o); o += 2
    buffer.writeUInt16LE(entry.p * 10, o); o += 2
    return o
  }
}

module.exports = Weather
