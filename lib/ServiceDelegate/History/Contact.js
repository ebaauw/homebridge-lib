// homebridge-lib/lib/ServiceDelegate/History/Contact.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2023 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../../../index')

const { History } = homebridgeLib.ServiceDelegate

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
    this.entry = { c: params.contactDelegate.value ? 1 : 0 }
    params.contactDelegate.on('didSet', (value) => {
      const now = History.now()
      params.timesOpenedDelegate.value += value
      params.lastActivationDelegate.value = this.lastActivationValue(now)
      this.entry.c = value ? 1 : 0
      this.addEntry({ time: now, c: this.entry.c })
    })
    this.addCharacteristicDelegate({
      key: 'resetTotal',
      Characteristic: this.Characteristics.eve.ResetTotal,
      value: params.resetTotal
    }).on('didSet', (value) => {
      params.timesOpenedDelegate.value = 0
    })
  }

  get fingerPrint () { return '01 0601' }

  entryToBuffer (entry) {
    const buffer = Buffer.alloc(2)
    let o = 0
    buffer.writeUInt8(0x01, o); o += 1
    buffer.writeUInt8(entry.c, o); o += 1
    return buffer.slice(0, o)
  }
}

module.exports = Contact
