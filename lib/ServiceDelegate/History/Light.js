// homebridge-lib/lib/ServiceDelegate/History/On.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2023 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../../../index')

const { History } = homebridgeLib.ServiceDelegate

/** Class for an Eve Light Strip _History_ service delegate.
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
  * `Characteristics.hap.On` characteristic.  It updates the
  * values of the associated `Characteristics.eve.LastActivation`
  * characteristic.
  * Note that the Eve Light Strip doesn't actually provide history entries;
  * the _History_ service is used only to provide a reference time for
  * last `LastActivation`.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Light extends History {
  /** Create a new instance of a Raspberry Pi _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} params.onDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.On`
    * characteristic.
    * @param {!CharacteristicDelegate} params.lastActivationDelegate - A
    * reference to the delegate of the associated
    * `Characteristics.eve.LastActivation` characteristic.
    */
  constructor (accessoryDelegate, params) {
    params.memorySize = 0
    super(accessoryDelegate, params)
    if (!(params.onDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.onDelegate: not a CharacteristicDelegate')
    }
    if (!(params.lastActivationDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.lastActivationDelegate: not a CharacteristicDelegate')
    }
    this.entry = { }
    params.onDelegate.on('didSet', (value) => {
      const now = History.now()
      if (params.lastActivationDelegate != null) {
        params.lastActivationDelegate.value = this.lastActivationValue(now)
      }
      this.addEntry({ time: now })
    })
  }

  get fingerPrint () { return '00' }

  entryToBuffer (entry) {
    return Buffer.alloc(0)
  }
}

module.exports = Light
