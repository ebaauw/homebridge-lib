// homebridge-lib/lib/ServiceDelegate/History/Contact.js
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

/** Class for an Eve Door _History_ service delegate.
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
  * `resetTotal`     | `Characteristics.eve.ResetTotal`
  *
  * This delegate creates the history from the associated
  * `Characteristics.hap.ContactSensorState` characteristic.  It updates the
  * values of the associated `Characteristics.eve.TimesOpened` and
  * `Characteristics.eve.LastActivation` characteristics.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Contact extends History {
  /** Create a new instance of an Eve Door & Window _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} params.contactDelegate - A reference to
    * thedelegate of the associated `Characteristics.hap.ContactSensorState`
    * characteristic.
    * @param {!CharacteristicDelegate} params.timesOpenedDelegate - A reference
    * to the delegate of the associated `Characteristics.eve.TimesOpened`
    * characteristic.
    * @param {!CharacteristicDelegate} params.lastActivationDelegate - A
    * reference to the delegate of the associated
    * `Characteristics.eve.LastActivation` characteristic.
    */
  constructor (accessoryDelegate, params) {
    super(accessoryDelegate, params)
    if (!(params.contactDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.contactDelegate: not a CharacteristicDelegate')
    }
    if (!(params.timesOpenedDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.timesOpenedDelegate: not a CharacteristicDelegate')
    }
    if (!(params.lastActivationDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.lastActivationDelegate: not a CharacteristicDelegate')
    }
    this._entry = { time: 0, status: params.contactDelegate.value }
    params.contactDelegate.on('didSet', (value) => {
      const now = Math.round(new Date().valueOf() / 1000)
      params.timesOpenedDelegate.value += value
      params.lastActivationDelegate.value = now - this._h.initialTime
      this._entry.status = value
      this._addEntry(now)
    })
    this.addCharacteristicDelegate({
      key: 'resetTotal',
      Characteristic: this.Characteristics.eve.ResetTotal,
      value: params.resetTotal
    }).on('didSet', (value) => {
      params.timesOpenedDelegate.value = 0
    })
  }

  get _fingerPrint () { return '01 0601' }

  _entryStream (entry) {
    return util.format(
      '|0b %s %s 01 %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.initialTime), 8),
      numToHex(entry.status, 2)
    )
  }
}

module.exports = Contact
