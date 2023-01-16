// homebridge-lib/lib/ServiceDelegate/History/Sensor.js
//
// Library for Homebridge plugins.
// Copyright © 2023 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../../../index')

const { History } = homebridgeLib.ServiceDelegate

/** Class for an Eve _History_ service delegate for a generic sensor accessory.
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
  * This delegate creates the history for a generic sensor, combining the features of the
  * following accessories:
  * - Eve Door & Window (contact);
  * - Eve Motion Sensor (motion, lightLevel, temperature);
  * - Eve Weather (temperature, humidiy. airPressure);
  * - Eve Room (temperature, humidity, vocDensity).
  *
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Sensor extends History {
  /** Create a new instance of an Eve Motion _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {?CharacteristicDelegate} params.contactDelegate - A reference to
    * the delegate of the associated `Characteristics.hap.ContactSensorState`
    * characteristic for a _Contact Sensor_ service.
    * @param {?CharacteristicDelegate} params.timesOpenedDelegate - A reference
    * to the delegate of the associated `Characteristics.eve.TimesOpened`
    * characteristic for the _Contact Sensor_ service.
    * @param {?CharacteristicDelegate} params.lastContactDelegate - A reference
    * to the delegate of the associated `Characteristics.eve.LastActivation`
    * characteristic for the _Contact Sensor_ service.
    * @param {?CharacteristicDelegate} params.motionDelegate - A reference to
    * the delegate of the associated `Characteristics.hap.MotionDetected`
    * characteristic for a _Motion Sensor_ service.
    * @param {?CharacteristicDelegate} params.lastMotionDelegate - A reference
    * to the delegate of the associated `Characteristics.eve.LastActivation`
    * characteristic for the _Motion Sensor_ service.
    * @param {?CharacteristicDelegate} params.lightLevelDelegate - A reference
    * to the delegate of the associated
    * `Characteristics.hap.CurrentAmbientLightLevel` characteristic for a
    * _Light Level Sensor_ service.
    * @param {?CharacteristicDelegate} params.temperatureDelegate - A reference
    * to the delegate of the associated `Characteristics.hap.CurrentTemperature`
    * characteristic for a _Temperature Sensor_ service.
    * @param {?CharacteristicDelegate} params.humidityDelegate - A reference
    * to the delegate of the associated `Characteristics.hap.CurrentRelativeHumidity`
    * characteristic for a _Humidity Sensor_ service.
    * @param {?CharacteristicDelegate} params.airPressureDelegate - A reference to
    * the delegate of the associated `Characteristics.eve.AirPressure`
    * characteristic for an _Air Pressure Sensor_ service.
    * @param {?CharacteristicDelegate} params.vocDensityDelegate - A reference
    * to the delegate of the associated `Characteristics.hap.VOCDensity`
    * characteristic for an _Air Qualility Sensor_ service.
    */
  constructor (accessoryDelegate, params) {
    super(accessoryDelegate, params)
    this.entry = {}

    if (params.contactDelegate != null) {
      if (!(params.contactDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
        throw new TypeError('params.contactDelegate: not a CharacteristicDelegate')
      }
      if (!(params.timesOpenedDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
        throw new TypeError('params.timesOpenedDelegate: not a CharacteristicDelegate')
      }
      if (!(params.lastContactDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
        throw new TypeError('params.lastContactDelegate: not a CharacteristicDelegate')
      }
      this.entry.c = params.contactDelegate.value ? 1 : 0
      params.contactDelegate.on('didSet', (value) => {
        const now = History.now()
        params.timesOpenedDelegate.value += value
        params.lastContactDelegate.value = this.lastActivationValue(now)
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

    if (params.motionDelegate != null) {
      if (!(params.motionDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
        throw new TypeError('params.motionDelegate: not a CharacteristicDelegate')
      }
      if (!(params.lastMotionDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
        throw new TypeError('params.lastMotionDelegate: not a CharacteristicDelegate')
      }
      this.entry.m = params.motionDelegate.value ? 1 : 0
      params.motionDelegate.on('didSet', (value) => {
        const now = History.now()
        params.lastMotionDelegate.value = this.lastActivationValue(now)
        this.entry.m = value ? 1 : 0
        this.addEntry({ time: now, m: this.entry.m })
      })
    }

    if (params.lightLevelDelegate != null) {
      if (!(params.lightLevelDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
        throw new TypeError('params.lightLevelDelegate: not a CharacteristicDelegate')
      }
      this.entry.l = params.lightLevelDelegate.value
      params.lightLevelDelegate.on('didSet', (value) => {
        this.entry.l = value
      })
    }

    if (params.temperatureDelegate != null) {
      if (!(params.temperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
        throw new TypeError('params.temperatureDelegate: not a CharacteristicDelegate')
      }
      this.entry.t = params.temperatureDelegate.value * 100
      params.temperatureDelegate.on('didSet', (value) => {
        this.entry.t = value * 100
      })
    }

    if (params.humidityDelegate != null) {
      if (!(params.humidityDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
        throw new TypeError('params.humidityDelegate: not a CharacteristicDelegate')
      }
      this.entry.h = params.humidityDelegate.value * 100
      params.humidityDelegate.on('didSet', (value) => {
        this.entry.h = value * 100
      })
    }

    if (params.airPressureDelegate != null) {
      if (!(params.airPressureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
        throw new TypeError('params.airPressureDelegate: not a CharacteristicDelegate')
      }
      this.entry.a = params.airPressureDelegate.value * 10
      params.airPressureDelegate.on('didSet', (value) => {
        this.entry.a = value * 10
      })
    }

    if (params.vocDensityDelegate != null) {
      if (!(params.vocDensityDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
        throw new TypeError('params.vocDensityDelegate: not a CharacteristicDelegate')
      }
      this.entry.q = params.vocDensityDelegate.value
      params.vocDensityDelegate.on('didSet', (value) => {
        this.entry.q = value
      })
    }
  }

  get fingerPrint () {
    // entry:     c    m    l    t    h    a    v
    // mask:   0x01 0x02 0x04 0x08 0x10 0x20 0x40
    return '07 0601 1C01 3002 0102 0202 0302 2202'
  }

  entryToBuffer (entry) {
    const buffer = Buffer.alloc(16)
    let mask = 0
    let o = 1
    if (entry.c != null) {
      mask |= 0x01
      buffer.writeUInt8(entry.c, o); o += 1
    }
    if (entry.m != null) {
      mask |= 0x02
      buffer.writeUInt8(entry.m, o); o += 1
    }
    if (entry.l != null) {
      mask |= 0x04
      buffer.writeUInt16LE(entry.l, o); o += 2
    }
    if (entry.t != null) {
      mask |= 0x08
      buffer.writeUInt16LE(entry.t, o); o += 2
    }
    if (entry.h != null) {
      mask |= 0x10
      buffer.writeUInt16LE(entry.h, o); o += 2
    }
    if (entry.a != null) {
      mask |= 0x20
      buffer.writeUInt16LE(entry.a, o); o += 2
    }
    if (entry.q != null) {
      mask |= 0x40
      buffer.writeUInt16LE(entry.q, o); o += 2
    }
    buffer.writeUInt8(mask, 0)
    return buffer.slice(0, o)
  }
}

module.exports = Sensor
