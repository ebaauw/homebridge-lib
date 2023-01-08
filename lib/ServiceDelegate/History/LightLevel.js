// homebridge-lib/lib/ServiceDelegate/History/LightLevel.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2023 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../../../index')

const { History } = homebridgeLib.ServiceDelegate

/** Class for an Eve Motion _History_ service delegate.
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
  * `Characteristics.hap.MotionDetected` characteristic.  It updates the
  * value of the associated `Characteristics.eve.LastActivation` characteristic.
  * Optionally, this delegate also mainatins history for
  * `Characteristics.hap.CurrentAmbientLightLevel`,
  * `Characteristics.hap.CurrentTemperature`, and
  * `Characteristics.hap.CurrentRelativeHumidity`.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class LightLevel extends History {
  /** Create a new instance of an Eve Motion _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} params.lightLevelDelegate - A reference
    * to the delegate of the associated
    * `Characteristics.hap.CurrentAmbientLightLevel` characteristic.
    * For PIR sensors (like the Hue motion sensor) that report light level in
    * addition to motion.
    * @param {?CharacteristicDelegate} params.temperatureDelegate - A reference
    * to the delegate of the associated `Characteristics.hap.CurrentTemperature`
    * characteristic.
    * For PIR sensors (like the Hue motion sensor) that report temperature in
    * addition to motion and light level.
    * @param {?CharacteristicDelegate} params.humidityDelegate - A reference
    * to the delegate of the associated `Characteristics.hap.CurrentRelativeHumidity`
    * characteristic.
    * For PIR sensors (like the OWON PIR313 sensor) that report humidity in
    * addition to motion, light level, and temperature.
    */
  constructor (accessoryDelegate, params) {
    super(accessoryDelegate, params)
    if (!(params.lightLevelDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.lightLevelDelegate: not a CharacteristicDelegate')
    }
    this.entry = { l: params.lightLevelDelegate.value }
    params.lightLevelDelegate.on('didSet', (value) => {
      this.entry.l = value
    })
    if (params.temperatureDelegate != null) {
      if (!(params.temperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
        throw new TypeError('params.temperatureDelegate: not a CharacteristicDelegate')
      }
      this.entry.t = params.temperatureDelegate.value
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
      }
    }
  }

  get fingerPrint () {
    return '03 3002 0102 0202'
  }

  entryToBuffer (entry) {
    const buffer = Buffer.alloc(6)
    let o = 0
    if (entry.t == null) {
      buffer.writeUInt8(0x01, o); o += 1
      buffer.writeUInt16LE(entry.l, o); o += 2
      return buffer.slice(0, o)
    }
    if (entry.h == null) {
      buffer.writeUInt8(0x03, o); o += 1
      buffer.writeUInt16LE(entry.l, o); o += 2
      buffer.writeUInt16LE(entry.t * 100, o); o += 2
      return buffer.slice(0, o)
    }
    buffer.writeUInt8(0x07, o); o += 1
    buffer.writeUInt16LE(entry.l, o); o += 2
    buffer.writeUInt16LE(entry.t * 100, o); o += 2
    buffer.writeUInt16LE(entry.h * 100, o); o += 2
    return buffer.slice(0, o)
  }
}

module.exports = LightLevel
