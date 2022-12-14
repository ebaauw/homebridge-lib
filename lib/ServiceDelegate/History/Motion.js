// homebridge-lib/lib/ServiceDelegate/History/Motion.js
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
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Motion extends ServiceDelegate.History {
  /** Create a new instance of an Eve Motion _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} params.motionDelegate - A reference to
    * the delegate of the associated `Characteristics.hap.MotionDetected`
    * characteristic.
    * @param {!CharacteristicDelegate} params.lastActivationDelegate - A
    * reference to the delegate of the associated
    * `Characteristics.eve.LastActivation` characteristic.
    * @param {?CharacteristicDelegate} params.lightLevelDelegate - A reference
    * to the delegate of the associated
    * `Characteristics.hap.CurrentAmbientLightLevel` characteristic.
    * For PIR sensors (like the Hue motion sensor) that report light level in
    * addition to motion.
    * @param {?CharacteristicDelegate} params.temperatureDelegate - A reference
    * to the delegate of the associated `Characteristics.hap.CurrentTemperature`
    * characteristic.
    * For PIR sensors (like the Hue motion sensor) that report temperature in
    * addition to motion.
    */
  constructor (accessoryDelegate, params) {
    super(accessoryDelegate, params)
    if (!(params.motionDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.motionDelegate: not a CharacteristicDelegate')
    }
    if (!(params.lastActivationDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('params.lastActivationDelegate: not a CharacteristicDelegate')
    }
    if (
      params.lightLevelDelegate != null &&
      !(params.lightLevelDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('params.lightLevelDelegate: not a CharacteristicDelegate')
    }
    if (
      params.temperatureDelegate != null &&
      !(params.temperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('params.temperatureDelegate: not a CharacteristicDelegate')
    }
    this._entry = { time: 0, m: params.motionDelegate.value ? 1 : 0 }
    params.motionDelegate.on('didSet', (value) => {
      const now = Math.round(new Date().valueOf() / 1000)
      params.lastActivationDelegate.value = now - this._h.initialTime
      this._entry.m = value ? 1 : 0
      if (this._entry.t != null) {
        const l = this._entry.l
        const t = this._entry.t
        delete this._entry.l
        delete this._entry.t
        this._addEntry(now)
        this._entry.l = l
        this._entry.t = t
      } else {
        this._addEntry(now)
      }
    })
    if (params.lightLevelDelegate != null) {
      this._entry.l = params.lightLevelDelegate.value
      params.lightLevelDelegate.on('didSet', (value) => {
        this._entry.l = value
      })
    }
    if (params.temperatureDelegate != null) {
      this._entry.t = params.temperatureDelegate.value
      params.temperatureDelegate.on('didSet', (value) => {
        this._entry.t = value
      })
    }
  }

  get _fingerPrint () {
    return '03 1C01 3002 0102'
  }

  _writeEntry (buffer, offset, entry) {
    let o = offset
    if (entry.t == null) {
      if (entry.l == null) {
        buffer.writeUInt8(11, o); o += 1
        buffer.writeUInt32LE(this._h.currentEntry, o); o += 4
        buffer.writeUInt32LE(entry.time - this._h.initialTime, o); o += 4
        buffer.writeUInt8(0x01, o); o += 1
        buffer.writeUInt8(entry.m, o); o += 1
        return o
      }
      buffer.writeUInt8(13, o); o += 1
      buffer.writeUInt32LE(this._h.currentEntry, o); o += 4
      buffer.writeUInt32LE(entry.time - this._h.initialTime, o); o += 4
      buffer.writeUInt8(0x03, o); o += 1
      buffer.writeUInt8(entry.m, o); o += 1
      buffer.writeUInt16LE(entry.l, o); o += 2
      return o
    }
    if (entry.l == null) {
      buffer.writeUInt8(13, o); o += 1
      buffer.writeUInt32LE(this._h.currentEntry, o); o += 4
      buffer.writeUInt32LE(entry.time - this._h.initialTime, o); o += 4
      buffer.writeUInt8(0x05, o); o += 1
      buffer.writeUInt8(entry.m, o); o += 1
      buffer.writeUInt16LE(entry.t * 100, o); o += 2
      return o
    }
    buffer.writeUInt8(15, o); o += 1
    buffer.writeUInt32LE(this._h.currentEntry, o); o += 4
    buffer.writeUInt32LE(entry.time - this._h.initialTime, o); o += 4
    buffer.writeUInt8(0x07, o); o += 1
    buffer.writeUInt8(entry.m, o); o += 1
    buffer.writeUInt16LE(entry.l, o); o += 2
    buffer.writeUInt16LE(entry.t * 100, o); o += 2
    return o
  }
}

module.exports = Motion
