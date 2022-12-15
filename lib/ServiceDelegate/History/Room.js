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

const { ServiceDelegate } = homebridgeLib

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
    * @param {!CharacteristicDelegate} params.temperatureDelegate - A reference
    * to the delegate of the associated `Characteristics.hap.CurrentTemperature`
    * characteristic.
    * @param {!CharacteristicDelegate} params.humidityDelegate - A reference to
    * the delegate of the associated
    * `Characteristics.hap.CurrentRelativeHumidity` characteristic.
    * @param {!CharacteristicDelegate} params.vocDensityDelegate - A reference
    * to the delegate of the associated `Characteristics.eve.AirPressure`
    * characteristic.
    */
  constructor (accessoryDelegate, params) {
    super(accessoryDelegate, params)
    if (!(params.temperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.temperatureDelegate: not a CharacteristicDelegate')
    }
    if (!(params.humidityDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.humidityDelegate: not a CharacteristicDelegate')
    }
    if (!(params.vocDensityDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.vocDensityDelegate: not a CharacteristicDelegate')
    }
    this._entry = {
      time: 0,
      t: params.temperatureDelegate.value,
      h: params.humidityDelegate.value,
      v: params.vocDensityDelegate.value
    }
    params.temperatureDelegate.on('didSet', (value) => {
      this._entry.t = value
    })
    params.humidityDelegate.on('didSet', (value) => {
      this._entry.h = value
    })
    params.vocDensityDelegate.on('didSet', (value) => {
      this._entry.v = value
    })
  }

  get _fingerPrint () {
    return '03 0102 0202 2202'
  }

  _entryToBuffer (entry) {
    const buffer = Buffer.alloc(7)
    let o = 0
    buffer.writeUInt8(0x07, o); o += 1
    buffer.writeUInt16LE(entry.t * 100, o); o += 2
    buffer.writeUInt16LE(entry.h * 100, o); o += 2
    buffer.writeUInt16LE(entry.v, o); o += 2
    return buffer.slice(0, o)
  }
}

module.exports = Room
