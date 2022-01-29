// homebridge-lib/lib/ServiceDelegate/History/On.js
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
const { swap32, numToHex } = History

/** Class for a Raspberry Pi _History_ service delegate.
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
  * `Characteristics.hap.On` characteristic.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class On extends History {
  /** Create a new instance of a Raspberry Pi _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} onDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.On`
    * characteristic.
    */
  constructor (accessoryDelegate, params, onDelegate, temperatureDelegate) {
    super(accessoryDelegate, params)
    if (!(onDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('onDelegate: not a CharacteristicDelegate')
    }
    if (
      temperatureDelegate != null &&
      !(temperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('temperatureDelegate: not a CharacteristicDelegate')
    }
    this._entry = {
      time: 0,
      on: onDelegate.value ? 1 : 0
    }
    onDelegate.on('didSet', (value) => {
      this._entry.on = value ? 1 : 0
      this._addEntry()
    })
    if (temperatureDelegate != null) {
      this._entry.temp = temperatureDelegate.value
      temperatureDelegate.on('didSet', (value) => {
        this._entry.temp = value
      })
    }
  }

  get _fingerPrint () { return '01 0e01' }

  _entryStream (entry) {
    return util.format(
      '|0b %s %s 01 %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.initialTime), 8),
      numToHex(entry.on, 2)
    )
  }
}

module.exports = On
