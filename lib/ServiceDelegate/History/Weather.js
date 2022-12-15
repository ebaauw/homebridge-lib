// homebridge-lib/lib/ServiceDelegate/History/Weather.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2022 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../../../index')

const { History } = homebridgeLib.ServiceDelegate

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
class Weather extends History {
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
    this.entry = { t: params.temperatureDelegate.value }
    params.temperatureDelegate.on('didSet', (value) => {
      this.entry.t = value
    })
    if (params.humidityDelegate != null) {
      if (!(params.humidityDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
        throw new TypeError('params.humidityDelegate: not a CharacteristicDelegate')
      }
      this.entry.h = params.humidityDelegate.value
      params.humidityDelegate.on('didSet', (value) => {
        this.entry.h = value
      })
      if (params.airPressureDelegate != null) {
        if (!(params.airPressureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
          throw new TypeError('params.airPressureDelegate: not a CharacteristicDelegate')
        }
        this.entry.p = params.airPressureDelegate.value
        params.airPressureDelegate.on('didSet', (value) => {
          this.entry.p = value
        })
      }
    }
  }

  get fingerPrint () { return '03 0102 0202 0302' }

  entryToBuffer (entry) {
    const buffer = Buffer.alloc(7)
    let o = 0
    if (entry.h == null) {
      buffer.writeUInt8(0x01, o); o += 1
      buffer.writeUInt16LE(entry.t * 100, o); o += 2
      return buffer.slice(0, o)
    }
    if (entry.p == null) {
      buffer.writeUInt8(0x03, o); o += 1
      buffer.writeUInt16LE(entry.t * 100, o); o += 2
      buffer.writeUInt16LE(entry.h * 100, o); o += 2
      return buffer.slice(0, o)
    }
    buffer.writeUInt8(0x07, o); o += 1
    buffer.writeUInt16LE(entry.t * 100, o); o += 2
    buffer.writeUInt16LE(entry.h * 100, o); o += 2
    buffer.writeUInt16LE(entry.p * 10, o); o += 2
    return buffer.slice(0, o)
  }
}

module.exports = Weather
