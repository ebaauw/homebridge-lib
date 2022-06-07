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
const util = require('util')

const { ServiceDelegate } = homebridgeLib
const { History } = ServiceDelegate
const { swap16, swap32, numToHex } = History

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
class Motion extends History {
  /** Create a new instance of an Eve Motion _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} motionDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.MotionDetected`
    * characteristic.
    * @param {!CharacteristicDelegate} lastActivationDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.LastActivation`
    * characteristic.
    * @param {?CharacteristicDelegate} lightLevelDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.CurrentAmbientLightLevel`
    * characteristic.  For PIR sensors (like the Hue motion sensor) that report
    * light level in addition to motion.
    * @param {?CharacteristicDelegate} temperatureDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.CurrentTemperature`
    * characteristic.  For PIR sensors (like the Hue motion sensor) that report
    * temperature in addition to motion.
    */
  constructor (
    accessoryDelegate, params,
    motionDelegate, lastActivationDelegate,
    lightLevelDelegate, temperatureDelegate
  ) {
    super(accessoryDelegate, params)
    if (!(motionDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('motionDelegate: not a CharacteristicDelegate')
    }
    if (!(lastActivationDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('lastActivationDelegate: not a CharacteristicDelegate')
    }
    if (
      lightLevelDelegate != null &&
      !(lightLevelDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('lightLevelDelegate: not a CharacteristicDelegate')
    }
    if (
      temperatureDelegate != null &&
      !(temperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('temperatureDelegate: not a CharacteristicDelegate')
    }
    this._entry = { time: 0, status: motionDelegate.value }
    motionDelegate.on('didSet', (value) => {
      const now = Math.round(new Date().valueOf() / 1000)
      lastActivationDelegate.value = now - this._h.initialTime
      this._entry.status = value
      if (this._entry.temp != null) {
        const lightlevel = this._entry.lightlevel
        const temp = this._entry.temp
        this._entry.lightlevel = null
        this._entry.temp = null
        this._addEntry(now)
        this._entry.lightlevel = lightlevel
        this._entry.temp = temp
      } else {
        this._addEntry(now)
      }
    })
    if (lightLevelDelegate != null) {
      this._entry.lightlevel = lightLevelDelegate.value
      lightLevelDelegate.on('didSet', (value) => {
        this._entry.lightlevel = value
      })
    }
    if (temperatureDelegate != null) {
      this._entry.temp = temperatureDelegate.value
      temperatureDelegate.on('didSet', (value) => {
        this._entry.temp = value
      })
    }
  }

  get _fingerPrint () {
    return '03 1c01 3002 0102'
  }

  _entryStream (entry) {
    if (entry.temp == null) {
      if (entry.lightlevel == null) {
        return util.format(
          '|0b %s %s 01 %s',
          numToHex(swap32(this._h.currentEntry), 8),
          numToHex(swap32(entry.time - this._h.initialTime), 8),
          numToHex(entry.status, 2)
        )
      }
      return util.format(
        '|0d %s %s 03 %s %s',
        numToHex(swap32(this._h.currentEntry), 8),
        numToHex(swap32(entry.time - this._h.initialTime), 8),
        numToHex(entry.status, 2),
        numToHex(swap16(entry.lightlevel), 4)
      )
    }
    if (entry.lightlevel == null) {
      return util.format(
        '|0d %s %s 05 %s %s',
        numToHex(swap32(this._h.currentEntry), 8),
        numToHex(swap32(entry.time - this._h.initialTime), 8),
        numToHex(entry.status, 2),
        numToHex(swap16(entry.temp * 100), 4)
      )
    }
    return util.format(
      '|0f %s %s 07 %s %s %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.initialTime), 8),
      numToHex(entry.status, 2),
      numToHex(swap16(entry.lightlevel), 4),
      numToHex(swap16(entry.temp * 100), 4)
    )
  }
}

module.exports = Motion
