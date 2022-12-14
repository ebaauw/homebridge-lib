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

const { ServiceDelegate } = homebridgeLib
const { History } = ServiceDelegate

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
    * @param {!CharacteristicDelegate} params.onDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.On`
    * characteristic.
    * @param {?CharacteristicDelegate} params.lastActivationDelegate - A
    * reference to the delegate of the associated
    * `Characteristics.eve.LastActivation` characteristic.
    */
  constructor (accessoryDelegate, params) {
    super(accessoryDelegate, params)
    if (!(params.onDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.onDelegate: not a CharacteristicDelegate')
    }
    if (
      params.lastActivationDelegate != null &&
      !(params.lastActivationDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('params.lastActivationDelegate: not a CharacteristicDelegate')
    }

    this._entry = { time: 0, o: params.onDelegate.value ? 1 : 0 }
    params.onDelegate.on('didSet', (value) => {
      const now = Math.round(new Date().valueOf() / 1000)
      if (params.lastActivationDelegate != null) {
        params.lastActivationDelegate.value = now - this._h.initialTime
      }
      this._entry.o = value ? 1 : 0
      this._addEntry(now)
    })
  }

  get _fingerPrint () { return '01 0E01' }

  _writeEntry (buffer, offset, entry) {
    let o = offset
    buffer.writeUInt8(11, o); o += 1
    buffer.writeUInt32LE(this._h.currentEntry, o); o += 4
    buffer.writeUInt32LE(entry.time - this._h.initialTime, o); o += 4
    buffer.writeUInt8(0x01, o); o += 1
    buffer.writeUInt8(entry.o, o); o += 1
    return o
  }
}

module.exports = On
