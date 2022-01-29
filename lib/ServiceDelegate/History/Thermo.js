// homebridge-lib/lib/ServiceDelegate/History/Thermo.js
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

/** Class for an Eve Thermo _History_ service delegate.
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
  * `Characteristics.hap.TargetTemperature`, and
  * `Characteristics.eve.ValvePosition` characteristics.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Thermo extends ServiceDelegate.History {
  /** Create a new instance of an Eve Thermo _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} temperatureDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.CurrentTemperature`
    * characteristic.
    * @param {!CharacteristicDelegate} targetTemperatureDelegate - A reference
    * to the delegate of the associated `Characteristics.hap.TargetTemperature`
    * characteristic.
    * @param {!CharacteristicDelegate} valvePositionDelegate - A reference to
    * the delegate of the associated `Characteristics.eve.ValvePosition`
    * characteristic.
    */
  constructor (
    accessoryDelegate, params,
    temperatureDelegate, targetTemperatureDelegate, valvePositionDelegate
  ) {
    super(accessoryDelegate, params)
    if (!(temperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('temperatureDelegate: not a CharacteristicDelegate')
    }
    if (!(targetTemperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('targetTemperatureDelegate: not a CharacteristicDelegate')
    }
    if (!(valvePositionDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('valvePositionDelegate: not a CharacteristicDelegate')
    }
    this._entry = {
      time: 0,
      currentTemp: temperatureDelegate.value,
      setTemp: targetTemperatureDelegate.value,
      valvePosition: valvePositionDelegate.value
    }
    temperatureDelegate
      .on('didSet', (value) => { this._entry.currentTemp = value })
    targetTemperatureDelegate
      .on('didSet', (value) => { this._entry.setTemp = value })
    valvePositionDelegate
      .on('didSet', (value) => { this._entry.valvePosition = value })
  }

  // I think 1201 and 1d01 are for current mode and target more, but it doesn't
  // look like Eve displays any history for these.
  // As of v3.8.1, Eve no longer shows the valve position history.
  // get _fingerPrint () { return '05 0102 1102 1001 1201 1d01' }
  get _fingerPrint () { return '03 0102 1102 1001' }

  _entryStream (entry) {
    return util.format(
      // '|11 %s %s 1f %s %s %s 00 00',
      '|0f %s %s 07 %s %s %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.initialTime), 8),
      numToHex(swap16(entry.currentTemp * 100), 4),
      numToHex(swap16(entry.setTemp * 100), 4),
      numToHex(entry.valvePosition, 2)
    )
  }
}

module.exports = Thermo
