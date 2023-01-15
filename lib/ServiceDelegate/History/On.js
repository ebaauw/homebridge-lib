// homebridge-lib/lib/ServiceDelegate/History/On.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2023 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../../../index')

const { History } = homebridgeLib.ServiceDelegate

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
    * @param {?CharacteristicDelegate} params.temperatureDelegate - A reference
    * to the delegate of the associated `Characteristics.hap.CurrentTemperature`
    * characteristic.
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

    this.entry = { o: params.onDelegate.value ? 1 : 0 }
    params.onDelegate.on('didSet', (value) => {
      const now = History.now()
      if (params.lastActivationDelegate != null) {
        params.lastActivationDelegate.value = this.lastActivationValue(now)
      }
      this.entry.o = value ? 1 : 0
      this.addEntry({ time: now, o: this.entry.o })
    })

    if (params.temperatureDelegate != null) {
      if (!(params.temperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
        throw new TypeError('params.temperatureDelegate: not a CharacteristicDelegate')
      }
      this.entry.t = params.temperatureDelegate.value * 100
      params.temperatureDelegate.on('didSet', (value) => {
        this.entry.t = value * 100
      })
    }
  }

  get fingerPrint () { return '01 0E01 0102' }

  entryToBuffer (entry) {
    const buffer = Buffer.alloc(16)
    let mask = 0
    let o = 1
    if (entry.o != null) {
      mask |= 0x01
      buffer.writeUInt8(entry.o, o); o += 1
    }
    if (entry.t != null) {
      mask |= 0x02
      buffer.writeUInt16LE(entry.t, o); o += 2
    }
    buffer.writeUInt8(mask, 0)
    return buffer.slice(0, o)
  }
}

module.exports = On
