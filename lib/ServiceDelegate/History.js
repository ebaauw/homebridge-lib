// homebridge-lib/lib/ServiceDelegate/History.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2025 Erik Baauw. All rights reserved.
//
// The logic for handling Eve history was inspired by Simone Tisa's
// fakagato-history repository, copyright © 2017 simont77.
// See https://github.com/simont77/fakegato-history.

import { CharacteristicDelegate } from 'homebridge-lib/CharacteristicDelegate'
import { ServiceDelegate } from 'homebridge-lib/ServiceDelegate'

// Eve history keeps time as # seconds since epoch of 2001/01/01.
// @type {integer}
const epoch = Math.round(new Date('2001-01-01T00:00:00Z').valueOf() / 1000)

const defaultMemorySize = 6 * 24 * 7 * 4 // 4 weeks of 1 entry per 10 minutes

// Convert date (in # seconds since NodeJS epoch) to string.
// @param {integer} d - Seconds since NodeJS epoch.
// @returns {string} Human readable date string.
function dateToString (d) {
  return new Date(1000 * d).toString().slice(0, 24)
}

/** Abstract superclass for type of data point in Eve History.
  *
  * An Eve history service supports up to seven data points, corresponding to
  * an associated characteristic value.  These data points are defined by tag and
  * length in the fingerprint reported through `eve.HistoryStatus`.
  * Different history entries can contain a different combination of data points.
  * @abstract
  * @memberof ServiceDelegate.History
  */
class HistoryValue {
  /** Create a new data point type.
    * @param {ServiceDelegate.History} parent - The delegate for the `eve.History`
    * service.
    * @param {CharactertisticDelegate} delegate - The delefate for the associated
    * characteristic.
    */
  constructor (parent, delegate) {
    if (!(parent instanceof History)) {
      throw new TypeError('parent: not a ServiceDelegate.History')
    }
    if (!(delegate instanceof CharacteristicDelegate)) {
      throw new TypeError('delegate: not a CharacteristicDelegate')
    }
    this._parent = parent
    this._delegate = delegate
  }

  /** The 1-byte tag, identifying the data point to Eve.
    * @type {integer}
    */
  get tag () { }

  /** The 1-byte length of a data point value.
    * @type {integer}
    */
  get length () { return 2 }

  /** The 1-letter id, identifying a data point in the Eve history service delegate.
    * @type {string}
    */
  get id () { }

  /** Add the data point to an entry
    * @params {Object} entry - The history entry.
    */
  prepareEntry (entry) { entry[this.id] = this._delegate.value }

  /** Write the data point from an entry to a buffer.
    * @params {Object} entry - The history entry.
    * @params {Buffer} buffer - The buffer to write to.
    * @params {integer} offset - The offset within the buffer.
    */
  writeEntry (entry, buffer, offset) { buffer.writeUInt16LE(entry[this.id], offset) }
}

class TemperatureValue extends HistoryValue {
  get tag () { return 0x01 }
  get id () { return 't' }
  prepareEntry (entry) { entry[this.id] = this._delegate.value * 100 }
  writeEntry (entry, buffer, offset) { buffer.writeInt16LE(entry[this.id], offset) }
}

class HumidityValue extends HistoryValue {
  get tag () { return 0x02 }
  get id () { return 'h' }
  prepareEntry (entry) { entry[this.id] = this._delegate.value * 100 }
}

class AirPressureValue extends HistoryValue {
  get tag () { return 0x03 }
  get id () { return 'a' }
  prepareEntry (entry) { entry[this.id] = this._delegate.value * 10 }
}

class VocLevelValue extends HistoryValue {
  get tag () { return 0x04 }
  get id () { return 'r' }
}

class ContactValue extends HistoryValue {
  get tag () { return 0x06 }
  get length () { return 1 }
  get id () { return 'c' }
  prepareEntry (entry) { entry[this.id] = this._delegate.value }
  writeEntry (entry, buffer, offset) { buffer.writeInt8(entry[this.id], offset) }

  constructor (parent, delegate) {
    super(parent, delegate)
    delegate.on('didSet', (value) => {
      const now = History.now()
      const entry = { time: now }
      entry[this.id] = this._delegate.value
      parent.addEntry(entry)
      parent.lastContactDelegate.value = parent.lastActivationValue(now)
      parent.timesOpenedDelegate.value += value
    })
    parent.resetTotalHandlers.push((value) => {
      parent.timesOpenedDelegate.value = 0
    })
  }
}

// Eve history entries for _Total Consumption_ actually contain the (average) power,
// in 0.1 W, since the previous entry.  Eve computes the displayed consumption in Wh.

// Device delivers _Total Consumption_ in kWh.
// We compute average power, and, optionally, update _Consumption_ (power).
class TotalConsumptionValue extends HistoryValue {
  get tag () { return 0x07 }
  get id () { return 'p' }

  constructor (parent, delegate) {
    super(parent, delegate)
    parent.addCharacteristicDelegate({
      key: 'consumption',
      unit: ' kWh',
      value: delegate.value,
      silent: true
    })
    parent.addCharacteristicDelegate({
      key: 'time',
      value: History.now(),
      silent: true
    })
  }

  prepareEntry (entry) {
    if (this._delegate.value < this._parent.values.consumption) {
      // Total consumption has been reset
      this._parent.values.consumption = 0
    }
    const consumption =
      (this._delegate.value - this._parent.values.consumption) * 1000 * 3600 // Ws
    const period = entry.time - this._parent.values.time // s
    const power = consumption / period // W
    entry[this.id] = Math.round(power * 10) // 0.1 W
    if (this._parent.computedConsumptionDelegate != null) {
      this._parent.computedConsumptionDelegate.value = Math.round(power * 10) / 10 // W
    }
    this._parent.values.consumption = this._delegate.value
    this._parent.values.time = entry.time
  }
}

// Device delivers _Consumption_ (power) in W.
// We compute _Total Consumption_ and average power, and update _Total Consumption_.
class ConsumptionValue extends HistoryValue {
  get tag () { return 0x07 }
  get id () { return 'p' }

  constructor (parent, delegate) {
    super(parent, delegate)
    this._consumption = 0 // Ws
    this._period = 0 // s
    this._totalConsumption = parent.computedTotalConsumptionDelegate.value * 1000 * 3600 // Ws
    this._power = delegate.value // W
    this._time = History.now()
    delegate.on('didSet', (value) => {
      this.updateRunningTotals()
      this._power = value // W
    })
    parent.resetTotalHandlers.push((value) => {
      this._totalConsumption = 0 // Ws
      parent.computedTotalConsumptionDelegate.value = 0 // kWh
    })
  }

  prepareEntry (entry) {
    this.updateRunningTotals(entry.time)

    const power = this._period === 0 ? 0 : this._consumption / this._period // W
    entry[this.id] = Math.round(power * 10) // 0.1 W
    const totalConsumption = this._totalConsumption / (1000 * 3600) // kWh
    this._parent.computedTotalConsumptionDelegate.value =
      Math.round(totalConsumption * 100) / 100 // kWh

    this._consumption = 0
    this._period = 0
  }

  updateRunningTotals (now = History.now()) {
    const period = now - this._time // s
    const delta = this._power * period // Ws
    this._consumption += delta // Ws
    this._period += period // s
    this._totalConsumption += delta // Ws
    this._time = now
  }
}

// Device delivers (running) average _Consumption_ (power) in W.
class AverageConsumptionValue extends HistoryValue {
  get tag () { return 0x07 }
  get id () { return 'p' }
  prepareEntry (entry) { entry[this.id] = this._delegate.value * 10 }
}

class OnValue extends HistoryValue {
  get tag () { return 0x0E }
  get length () { return 1 }
  get id () { return 'o' }
  prepareEntry (entry) { entry[this.id] = this._delegate.value ? 1 : 0 }
  writeEntry (entry, buffer, offset) { buffer.writeInt8(entry[this.id], offset) }

  constructor (parent, delegate) {
    super(parent, delegate)
    delegate.on('didSet', (value) => {
      const now = History.now()
      const entry = { time: now }
      entry[this.id] = this._delegate.value ? 1 : 0
      parent.addEntry(entry)
      parent.lastOnDelegate.value = parent.lastActivationValue(now)
    })
  }
}

class ValvePositionValue extends HistoryValue {
  get tag () { return 0x10 }
  get length () { return 1 }
  get id () { return 'v' }
  writeEntry (entry, buffer, offset) { buffer.writeInt8(entry[this.id], offset) }
}

class TargetTemperatureValue extends HistoryValue {
  get tag () { return 0x11 }
  get id () { return 's' }
  prepareEntry (entry) { entry[this.id] = this._delegate.value * 100 }
  writeEntry (entry, buffer, offset) { buffer.writeInt16LE(entry[this.id], offset) }
}

class MotionValue extends HistoryValue {
  get tag () { return 0x1C }
  get length () { return 1 }
  get id () { return 'm' }
  prepareEntry (entry) { entry[this.id] = this._delegate.value ? 1 : 0 }
  writeEntry (entry, buffer, offset) { buffer.writeInt8(entry[this.id], offset) }

  constructor (parent, delegate) {
    super(parent, delegate)
    delegate.on('didSet', (value) => {
      const now = History.now()
      const entry = { time: now }
      entry[this.id] = this._delegate.value ? 1 : 0
      parent.addEntry(entry)
      parent.lastMotionDelegate.value = parent.lastActivationValue(now)
    })
  }
}

class VocDensityValue extends HistoryValue {
  get tag () { return 0x22 }
  get id () { return 'q' }
}

class ButtonValue extends HistoryValue {
  get tag () { return 0x24 }
  get length () { return 1 }
  get id () { return 'b' }
  writeEntry (entry, buffer, offset) { buffer.writeInt8(entry[this.id], offset) }
}

class LightLevelValue extends HistoryValue {
  get tag () { return 0x30 }
  get id () { return 'l' }
  prepareEntry (entry) { entry[this.id] = Math.round(this._delegate.value) }
}

// Types of delegates for characteristics for history data points.
const historyValueTypes = {
  temperature: TemperatureValue,
  humidity: HumidityValue,
  vocLevel: VocLevelValue,
  airPressure: AirPressureValue,
  contact: ContactValue,
  totalConsumption: TotalConsumptionValue,
  consumption: ConsumptionValue,
  averageConsumption: AverageConsumptionValue,
  on: OnValue,
  valvePosition: ValvePositionValue,
  targetTemperature: TargetTemperatureValue,
  motion: MotionValue,
  vocDensity: VocDensityValue,
  button: ButtonValue,
  lightLevel: LightLevelValue
}

// Types of delegates for characteristic maintained by Eve history.
const historyDerivedTypes = {
  lastContact: 'contact',
  timesOpened: 'contact',
  lastMotion: 'motion',
  lastOn: 'on',
  lastLightOn: 'lightOn',
  computedConsumption: 'totalConsumption',
  computedTotalConsumption: 'consumption'
}

/** Class for an Eve _History_ service delegate.
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
  * @abstract
  * @extends ServiceDelegate
  * @memberof ServiceDelegate
  */
class History extends ServiceDelegate {
  /** Create a new instance of an Eve _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the _History_ HomeKit service.
    * @param {?CharacteristicDelegate} params.contactDelegate - The
    * `Characteristics.hap.ContactSensorState` characteristic delegate
    * for a `hap.ContactSensor` service.
    * @param {?CharacteristicDelegate} params.lastContactDelegate - The
    * `Characteristics.eve.LastActivation` characteristic delegate
    * for a `hap.ContactSensor` service.
    * @param {?CharacteristicDelegate} params.timesOpenedDelegate - The
    * `Characteristics.eve.TimesOpened` characteristic delegate
    * for a `hap.ContactSensor` service.
    * @param {?CharacteristicDelegate} params.motionDelegate - The
    * `Characteristics.hap.MotionDetected` characteristic delegate
    * for a `hap.MotionSensor` service.
    * @param {?CharacteristicDelegate} params.lastMotionDelegate - The
    * `Characteristics.eve.LastActivation` characteristic delegate
    * for a `hap.MotionSensor` service.
    * @param {?CharacteristicDelegate} params.lightLevelDelegate - The
    * `Characteristics.hap.CurrentAmbientLightLevel` characteristic delegate
    * for a `hap.LightLevelSensor` service.
    * @param {?CharacteristicDelegate} params.temperatureDelegate - The
    * `Characteristics.hap.CurrentTemperature` characteristic delegate
    * for a `hap.TemperatureSensor`, `eve.Weather`, or `hap.Thermostat` service.
    * @param {?CharacteristicDelegate} params.humidityDelegate - The
    * `Characteristics.hap.CurrentRelativeHumidity` characteristic delegate
    * for a `hap.HumiditySensor` or `eve.Weather` service.
    * @param {?CharacteristicDelegate} params.airPressureDelegate - The
    * `Characteristics.eve.AirPressure` characteristic delegate
    * for an `eve.AirPressureSensor` or `eve.Weather` service.
    * @param {?CharacteristicDelegate} params.vocDensityDelegate - The
    * `Characteristics.hap.VOCDensity` characteristic delegate
    * for a `hap.AirQualilitySensor` service.
    * @param {?CharacteristicDelegate} params.targetTemperatureDelegate - The
    * `Characteristics.hap.TargetTemperature` characteristic delegate
    * for a `hap.Thermostat` service.
    * @param {?CharacteristicDelegate} params.valvePositionDelegate - The
    * `Characteristics.eve.ValvePosition` characteristic delegate
    * for a `hap.Thermostat` service.
    * @param {?CharacteristicDelegate} params.onDelegate - The
    * `Characteristics.hap.On` characteristic delegate
    * for a `hap.Outlet` or a `hap.Switch` service.
    * @param {?CharacteristicDelegate} params.lastOnDelegate - The
    * `Characteristics.eve.LastActivation` characteristic delegate
    * for a `hap.Outlet` or a `hap.Switch` service.
    * @param {?CharacteristicDelegate} params.consumptionDelegate - The
    * `Characteristics.eve.Consumption` characteristic delegate
    * for a `hap.Outlet` or `eve.Consumption` service
    * for a device that reports power.
    * @param {?CharacteristicDelegate} params.computedTotalConsumptionDelegate - The
    * `Characteristics.eve.TotalConsumption` characteristic delegate
    * for a `hap.Outlet` or `eve.Consumption` service
    * for a device that reports power, but not total consumption.
    * @param {?CharacteristicDelegate} params.totalConsumptionDelegate - The
    * `Characteristics.eve.TotalConsumption` characteristic delegate
    * for a `hap.Outlet` or `eve.Consumption` service
    * for a device that reports total consumption.
    * @param {?CharacteristicDelegate} params.computedConsumptionDelegate - The
    * `Characteristics.eve.Consumption` characteristic delegate
    * for a `hap.Outlet` or `eve.Consumption` service
    * for a device that reports total consumption but not power.
    * @param {?CharacteristicDelegate} params.avarageConsumptionDelegate - The
    * `Characteristics.eve.Consumption` characteristic delegate
    * for a `hap.Outlet` or `eve.Consumption` service
    * for a device that reports runing average for power.
    * @param {?CharacteristicDelegate} params.lightOnDelegate - The
    * `Characteristics.hap.On` characteristic delegate
    * for a `hap.Lightbulb` service.
    * @param {?CharacteristicDelegate} params.lastLightOnDelegate - A
    * `Characteristics.eve.LastActivation` characteristic delegate
    * for a `hap.Lightbulb` service.
    * @param {integer} [params.memorySize=4032] - The memory size, in number of
    * history entries.  The default is 4 weeks of 1 entry per 10 minutes.
    * @param {?boolean} params.config - Expose config.
    */
  constructor (accessoryDelegate, params = {}) {
    params.name = accessoryDelegate.name + ' History'
    params.Service = accessoryDelegate.Services.eve.History
    params.hidden = true
    super(accessoryDelegate, params)
    this.resetTotalHandlers = []

    const delegates = []
    let i = 0
    for (const param of Object.keys(params)) {
      if (param.endsWith('Delegate')) {
        if (params[param] == null) {
          continue
        }
        if (!(params[param] instanceof CharacteristicDelegate)) {
          throw new TypeError(`params.${param}: not a CharacteristicDelegate`)
        }
        const key = param.slice(0, -8)
        if (historyDerivedTypes[key] != null) {
          if (params[historyDerivedTypes[key] + 'Delegate'] == null) {
            throw new SyntaxError(
              `params.${param}: missing params.${historyDerivedTypes[key]}Delegate`
            )
          }
          this[param] = params[param]
          continue
        }
        if (key === 'lightOn') {
          if (!(params.lastLightOnDelegate instanceof CharacteristicDelegate)) {
            throw new SyntaxError(`params.${param}: missing params.lastLightOnDelegate`)
          }
          params[param].on('didSet', (value) => {
            const now = History.now()
            params.lastLightOnDelegate.value = this.lastActivationValue(now)
            this.addEntry({ time: now })
          })
          continue
        }
        if (historyValueTypes[key] == null) {
          throw new SyntaxError(`params.${param}: invalid parameter`)
        }
        if (++i > 7) {
          throw new SyntaxError(`params.${param}: more than 7 history values`)
        }
        delegates.push({ key, param })
      }
    }
    const fingerPrint = Buffer.alloc(15)
    let offset = 0
    fingerPrint.writeUInt8(i, offset); offset++
    this._valueTypes = []
    for (const { key, param } of delegates) {
      const valueType = new historyValueTypes[key](this, params[param])
      fingerPrint.writeUInt8(valueType.tag, offset); offset++
      fingerPrint.writeUInt8(valueType.length, offset); offset++
      this._valueTypes.push(valueType)
    }
    this.fingerPrint = fingerPrint.slice(0, offset)
    this.debug('fingerPrint: 0x%s', this.fingerPrint.toString('hex').toUpperCase())
    const memorySize = i === 0
      ? 0
      : params.memorySize == null ? defaultMemorySize : params.memorySize

    this._transfer = false

    this.addCharacteristicDelegate({
      key: 'history',
      silent: true
    })
    if (this.values.history?.initialTime > History.now()) {
      this.warn('resetting history after time travel from %s', dateToString(this.values.history.initialTime))
      this.values.history = null
    }
    this._h = this.values.history
    if (this._h == null) {
      this.values.history = {
        memorySize,
        firstEntry: 1,
        lastEntry: 1,
        entryOffset: 0,
        entries: [null, null],
        initialTime: History.now()
      }
      this._h = this.values.history
    } else if (this._h.memorySize !== memorySize) {
      this.values.history = {
        memorySize,
        firstEntry: this._h.lastEntry,
        lastEntry: this._h.lastEntry,
        entryOffset: this._h.lastEntry - 1,
        entries: [null, null],
        initialTime: this._h.initialTime
      }
      this._h = this.values.history
    } else {
      this.debug(
        'restored %d history entries (%d to %d)', this._h.entries.length,
        this._h.firstEntry, this._h.lastEntry
      )
    }

    this.addCharacteristicDelegate({
      key: 'historyRequest',
      Characteristic: this.Characteristics.eve.HistoryRequest,
      value: params.historyRequest,
      setter: this._onSetHistoryRequest.bind(this),
      silent: true
    })

    this.addCharacteristicDelegate({
      key: 'setTime',
      Characteristic: this.Characteristics.eve.SetTime,
      value: params.setTime,
      silent: true
    }).on('didSet', (value) => {
      const buffer = Buffer.from(value, 'base64')
      this.vdebug('SetTime changed to %j', buffer.toString('hex'))
      const date = dateToString(buffer.readUInt32LE() + epoch)
      this.debug('SetTime changed to %s', date)
    })

    this.addCharacteristicDelegate({
      key: 'historyStatus',
      Characteristic: this.Characteristics.eve.HistoryStatus,
      value: params.historyStatus,
      silent: true
    })

    this.addCharacteristicDelegate({
      key: 'historyEntries',
      Characteristic: this.Characteristics.eve.HistoryEntries,
      value: params.historyEntries,
      getter: this._onGetEntries.bind(this),
      silent: true
    })

    if (this.resetTotalHandlers.length > 0) {
      this.addCharacteristicDelegate({
        key: 'resetTotal',
        Characteristic: this.Characteristics.eve.ResetTotal
      }).on('didSet', (value) => {
        for (const handler of this.resetTotalHandlers) {
          handler(value)
        }
      })
    }

    if (params.config) {
      this.addCharacteristicDelegate({
        key: 'configCommand',
        Characteristic: this.Characteristics.eve.ConfigCommand,
        setter: this._onSetConfig.bind(this)
        // silent: true
      })

      this.addCharacteristicDelegate({
        key: 'configData',
        Characteristic: this.Characteristics.eve.ConfigData,
        getter: this._onGetConfig.bind(this)
        // silent: true
      })
    }

    accessoryDelegate.propertyDelegate('name')
      .on('didSet', (value) => {
        this.values.configuredName = value + ' History'
      })

    this._accessoryDelegate.heartbeatEnabled = true
    this._accessoryDelegate
      .once('heartbeat', (beat) => {
        this._historyBeat = (beat % 600) + 5
      })
      .on('heartbeat', (beat) => {
        if (beat % 600 === this._historyBeat) {
          const entry = { time: History.now() }
          for (const valueType of this._valueTypes) {
            valueType.prepareEntry(entry)
          }
          this.addEntry(entry)
        }
      })
      .on('shutdown', () => {
        this.debug(
          'saved %d history entries (%d to %d)', this._h.entries.length,
          this._h.firstEntry, this._h.lastEntry
        )
      })
  }

  addLastOnDelegate (onDelegate, lastOnDelegate) {
    if (!(onDelegate instanceof CharacteristicDelegate)) {
      throw new TypeError('onDelegate: not a CharacteristicDelegate')
    }
    if (!(lastOnDelegate instanceof CharacteristicDelegate)) {
      throw new TypeError('lastOnDelegate: not a CharacteristicDelegate')
    }
    onDelegate.on('didSet', (value) => {
      lastOnDelegate.value = this.lastActivationValue()
    })
  }

  /** Return current time as # seconds since NodeJS epoch.
    * @returns {integer} # seconds since NodeJS epoch.
    */
  static now () { return Math.round(new Date().valueOf() / 1000) }

  /** Convert date intp `Characteristics.eve.LastActivation` characteristic value.
    * @param {integer} date - Seconds since NodeJS epoch.
    * @returns {integer} Value for last activation.
    */
  lastActivationValue (date = History.now()) { return date - this._h.initialTime }

  /** Convert a history entry to a buffer.
    * @abstract
    * @param {object} entry - The entry.
    * @returns {Buffer} A Buffer with the values from the entry.
    */
  entryToBuffer (entry) {
    const buffer = Buffer.alloc(16)
    let bitmap = 0
    let offset = 1
    for (const i in this._valueTypes) {
      try {
        const valueType = this._valueTypes[i]
        if (entry[valueType.id] != null) {
          bitmap |= 0x01 << i
          valueType.writeEntry(entry, buffer, offset)
          offset += valueType.length
        }
      } catch (error) { this.warn(error) }
    }
    buffer.writeUInt8(bitmap, 0)
    return buffer.slice(0, offset)
  }

  /** Add an entry to the history.
    * @param {object} entry - The entry.
    */
  addEntry (entry) {
    if (this._h.memorySize > 0) {
      if (this._h.lastEntry - this._h.entryOffset >= this._h.memorySize) {
        this._h.firstEntry++
      }
      this._h.lastEntry++
      const index = (this._h.lastEntry - this._h.entryOffset) % this._h.memorySize
      this.debug(
        'History Entries: set entry %d (index %d) to %j',
        this._h.lastEntry, index, entry
      )
      this._h.entries[index] = entry
    }

    this.debug('set History Status to %d .. %d', this._h.firstEntry, this._h.lastEntry)
    const buffer = Buffer.alloc(1024)
    let offset = 0
    buffer.writeUInt32LE(entry.time - this._h.initialTime, offset); offset += 4
    buffer.writeUInt32LE(0, offset); offset += 4
    buffer.writeUInt32LE(this._h.initialTime - epoch, offset); offset += 4
    this.fingerPrint.copy(buffer, offset); offset += this.fingerPrint.length
    buffer.writeUInt16LE(this._h.lastEntry - this._h.firstEntry + 1, offset); offset += 2
    buffer.writeUInt16LE(this._h.memorySize, offset); offset += 2
    buffer.writeUInt32LE(this._h.firstEntry, offset); offset += 4
    buffer.writeUInt32LE(0, offset); offset += 4
    buffer.writeUInt8(1, offset); offset += 1
    buffer.writeUInt8(1, offset); offset += 1
    const value = buffer.slice(0, offset)
    this.values.historyStatus = value.toString('base64')
  }

  async _onSetHistoryRequest (value) {
    const buffer = Buffer.from(value, 'base64')
    this.vdebug('History Request changed to %j', buffer.toString('hex'))
    const entry = buffer.readUInt32LE(2)
    this.debug(
      'History Request changed to %d (%d to %d)', entry,
      this._h.firstEntry, this._h.lastEntry
    )
    this._currentEntry = Math.max(this._h.firstEntry, entry)
    this._transfer = true
  }

  async _onGetEntries () {
    if (this._currentEntry > this._h.lastEntry || !this._transfer) {
      this.debug('History Entries: no entry')
      this.vdebug('History Entries: send data: 00')
      this._transfer = false
      return Buffer.from('00', 'hex').toString('base64')
    }

    const buffer = Buffer.alloc(1024)
    let offset = 0
    for (let i = 0; i < 11; i++) {
      const index = this._h.memorySize === 0
        ? 1
        : (this._currentEntry - this._h.entryOffset) % this._h.memorySize
      if (this._currentEntry === this._h.firstEntry) {
        this.debug(
          'History Entries (%d/11): entry %d (index: %d): %j (%s)',
          i, this._currentEntry, index, { initialTime: this._h.initialTime - epoch },
          dateToString(this._h.initialTime)
        )
        buffer.writeUInt8(21, offset); offset += 1
        buffer.writeUInt32LE(this._currentEntry, offset); offset += 4
        buffer.write('0100000081', offset, 'hex'); offset += 5
        buffer.writeUInt32LE(this._h.initialTime - epoch, offset); offset += 4
        buffer.write('00000000000000', offset, 'hex'); offset += 7
      } else {
        const entry = this._h.entries[index]
        this.debug(
          'History Entries (%d/11): entry %d (index: %d): %j (%s)',
          i, this._currentEntry, index, entry, dateToString(entry.time)
        )
        const b = this.entryToBuffer(entry)
        buffer.writeUInt8(b.length + 9, offset); offset += 1
        buffer.writeUInt32LE(this._currentEntry, offset); offset += 4
        buffer.writeUInt32LE(entry.time - this._h.initialTime, offset); offset += 4
        b.copy(buffer, offset); offset += b.length
      }
      this._currentEntry++
      if (this._currentEntry > this._h.lastEntry) {
        break
      }
    }
    const value = buffer.slice(0, offset)
    this.vdebug('History Entries: send data: %s', value.toString('hex'))
    return value.toString('base64')
  }

  async _onSetConfig (value) {
    const buffer = Buffer.from(value, 'base64')
    this.vdebug('Config Request changed to %j', buffer.toString('hex'))
  }

  async _onGetConfig () {
    return Buffer.from('D200', 'hex').toString('base64')
  }
}

ServiceDelegate.History = History
