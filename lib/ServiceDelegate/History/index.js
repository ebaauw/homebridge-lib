// homebridge-lib/lib/ServiceDelegate/History.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2023 Erik Baauw. All rights reserved.
//
// The logic for handling Eve history was inspired by Simone Tisa's
// fakagato-history repository, copyright © 2017 simont77.
// See https://github.com/simont77/fakegato-history.

'use strict'

const { CharacteristicDelegate } = require('../../../index')
const homebridgeLib = require('../../../index')

const { ServiceDelegate } = homebridgeLib

/** Eve history keeps time as # seconds since epoch of 2001/01/01.
  * @type {integer}
  */
const epoch = Math.round(new Date('2001-01-01T00:00:00Z').valueOf() / 1000)

const defaultMemorySize = 6 * 24 * 7 * 4 // 4 weeks of 1 entry per 10 minutes

/** Convert date (in # seconds since NodeJS epoch) to string.
  * @param {integer} d - # seconds since NodeJS epoch.
  * @returns {string} Human readable date string.
  */
function dateToString (d) {
  return new Date(1000 * d).toString().slice(0, 24)
}

/** An Eve history entry contains up to seven data points, each corresponding to
  * a characteristic value.
  */
class HistoryValue {
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

  get length () { return 2 }

  prepareEntry (entry) { entry[this.id] = this._delegate.value }
}

class TemperatureValue extends HistoryValue {
  get tag () { return 0x01 }
  get id () { return 't' }

  prepareEntry (entry) { entry[this.id] = this._delegate.value * 100 }
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

class ContactValue extends HistoryValue {
  get tag () { return 0x06 }
  get length () { return 1 }
  get id () { return 'c' }

  constructor (parent, delegate) {
    super(parent, delegate)
    delegate.on('didSet', (value) => {
      const now = History.now()
      const entry = { time: now }
      entry[this.id] = this._delegate.value ? 1 : 0
      parent.addEntry(entry)
      if (parent.lastContactDelegate != null) {
        parent.lastContactDelegate = parent.lastActivationValue(now)
      }
      if (parent.timesOpenedDelegate != null) {
        parent.timesOpenedDelegate.value += value
      }
    })
    parent.addCharacteristicDelegate({
      key: 'resetTotal',
      Characteristic: this.Characteristics.eve.ResetTotal
    }).on('didSet', (value) => {
      parent.timesOpenedDelegate.value = 0
    })
  }

  prepareEntry (entry) { entry[this.id] = this._delegate.value ? 1 : 0 }
}

class ConsumptionValue extends HistoryValue {
  get tag () { return 0x07 }
  get id () { return 'p' }

  constructor (parent, delegate) {
    super(parent, delegate)
    this._consumption = delegate.value
    this._time = History.now()
  }

  prepareEntry (entry) {
    const delta = this._delegate.value - this._consumption // kWh
    const period = entry.time - this._time // s
    const power = 1000 * 3600 * delta / period // W
    if (this._parent.computedPowerDelegate != null) {
      this._parent.computedPowerDelegate.value = Math.round(power) // W
    }
    entry[this.id] = Math.round(power * 10) // 0.1 W * 10 min
    this._consumption = this._delegate.value
    this._time = entry.time
  }
}

class PowerValue extends HistoryValue {
  get tag () { return 0x07 }
  get id () { return 'p' }

  constructor (parent, delegate) {
    super(parent, delegate)
    this._runningConsumption = 0 // 10-min-interval running value
    this._power = delegate.value // current power
    this._time = History.now() // start time of current power
    delegate.on('didSet', (value) => {
      const now = History.now()
      const delta = this._power * (now - this._time) // Ws
      this._runningConsumption += Math.round(delta / 60.0) // 0.1W * 10 min
      this._totalConsumption += delta / 36000.0 // 0.01 kWh
      this._power = value
      this._time = now
    })
    parent.addCharacteristicDelegate({
      key: 'resetTotal',
      Characteristic: this.Characteristics.eve.ResetTotal
    }).on('didSet', (value) => {
      this._runningConsumption = 0
      this._totalConsumption = 0
      parent.computedConsumptionDelegate.value = this._totalConsumption
    })
  }

  prepareEntry (entry) {
    const delta = this._power * (entry.time - this._time) // Ws
    this._runningConsumption += delta / 60.0 // 0.1 W * 10 min
    this._totalConsumption += delta / 36000.0 // 0.01 kWh
    this._parent.computedConsumptionDelegate.value = Math.round(this._totalConsumption) / 100.0 // kWh
    entry[this.id] = Math.round(this._runningConsumption) // 0.1 W * 10 min
    this._power = this._delegate.value
    this._time = entry.time
    this._runningConsumption = 0
  }
}

class ValvePositionValue extends HistoryValue {
  get tag () { return 0x10 }
  get length () { return 1 }
  get id () { return 'v' }
}

class TargetTemperatureValue extends HistoryValue {
  get tag () { return 0x11 }
  get id () { return 's' }

  prepareEntry (entry) { entry[this.id] = this._delegate.value * 100 }
}

class MotionValue extends HistoryValue {
  get tag () { return 0x1C }
  get length () { return 1 }
  get id () { return 'm' }

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

  prepareEntry (entry) { entry[this.id] = this._delegate.value ? 1 : 0 }
}

class OnValue extends HistoryValue {
  get tag () { return 0x1E }
  get length () { return 1 }
  get id () { return 'o' }

  constructor (parent, delegate) {
    super(parent, delegate)
    delegate.on('didSet', (value) => {
      const now = History.now()
      const entry = { time: now }
      entry[this.id] = this._delegate.value ? 1 : 0
      this._parent.addEntry(entry)
      parent.lastOnDelegate.value = parent.lastActivationValue(now)
    })
  }

  prepareEntry (entry) { entry[this.id] = this._delegate.value ? 1 : 0 }
}

class VocDensityValue extends HistoryValue {
  get tag () { return 0x22 }
  get id () { return 'q' }
}

class LightLevelValue extends HistoryValue {
  get tag () { return 0x30 }
  get id () { return 'l' }
}

const historyValueTypes = {
  temperature: TemperatureValue,
  humidity: HumidityValue,
  airPressure: AirPressureValue,
  contact: ContactValue,
  power: PowerValue,
  consumption: ConsumptionValue,
  valvePosition: ValvePositionValue,
  targetTemperature: TargetTemperatureValue,
  motion: MotionValue,
  on: OnValue,
  vocDensity: VocDensityValue,
  lightLevel: LightLevelValue
}

const historyDerivedTypes = {
  lastContact: 'contact',
  timesOpened: 'contact',
  lastMotion: 'motion',
  lastOn: 'on',
  lastLightOn: 'lightOn',
  computedConsumption: 'power',
  computedPower: 'consumption'
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
    * `hap.ContactSensorState` characteristic delegate
    * for a `hap.ContactSensor` service.
    * @param {?CharacteristicDelegate} params.lastContactDelegate - The
    * `eve.LastActivation` characteristic delegate
    * for a `hap.ContactSensor` service.
    * @param {?CharacteristicDelegate} params.timesOpenedDelegate - The
    * `eve.TimesOpened` characteristic delegate
    * for a `hap.ContactSensor` service.
    * @param {?CharacteristicDelegate} params.motionDelegate - The
    * `.hap.MotionDetected` characteristic delegate
    * for a `hap.MotionSensor` service.
    * @param {?CharacteristicDelegate} params.lastMotionDelegate - The
    * `.eve.LastActivation` characteristic delegate
    * for a `hap.MotionSensor` service.
    * @param {?CharacteristicDelegate} params.lightLevelDelegate - The
    * `.hap.CurrentAmbientLightLevel` characteristic delegate
    * for a `hap.LightLevelSensor` service.
    * @param {?CharacteristicDelegate} params.temperatureDelegate - The
    * `.hap.CurrentTemperature` characteristic delegate
    * for a `hap.TemperatureSensor`, `eve.Weather`, or `hap.Thermostat` service.
    * @param {?CharacteristicDelegate} params.humidityDelegate - The
    * `hap.CurrentRelativeHumidity` characteristic delegate
    * for a `hap.HumiditySensor` or `eve.Weather` service.
    * @param {?CharacteristicDelegate} params.airPressureDelegate - The
    * `.eve.AirPressure` characteristic delegate
    * for an `eve.AirPressureSensor` or `eve.Weather` service.
    * @param {?CharacteristicDelegate} params.vocDensityDelegate - The
    * `hap.VOCDensity` characteristic delegate
    * for a `hap.AirQualilitySensor` service.
    * @param {!CharacteristicDelegate} params.targetTemperatureDelegate - The
    * `hap.TargetTemperature` characteristic delegate
    * for a `hap.Thermostat` service.
    * @param {!CharacteristicDelegate} params.valvePositionDelegate - The
    * `.eve.ValvePosition` characteristic delegate
    * for a `hap.Thermostat` service.
    * @param {!CharacteristicDelegate} params.onDelegate - The
    * `Characteristics.hap.On` characteristic delegate
    * for a `hap.Outlet` service.
    * @param {?CharacteristicDelegate} params.lastOnDelegate - The
    * `.eve.LastActivation` characteristic delegate
    * for a `hap.Outlet` service.
    * @param {!CharacteristicDelegate} params.lightOnDelegate - The
    * `Characteristics.hap.On` characteristic delegate
    * for a `hap.Lightbulb` service.
    * @param {?CharacteristicDelegate} params.lastLightOnDelegate - A
    * `.eve.LastActivation` characteristic delegate
    * for a `hap.Lightbulb` service.
    * @param {!CharacteristicDelegate} params.powerDelegate - The
    * `.eve.CurrentConsumption` characteristic delegate
    * for a `hap.Outlet` or `eve.Consumption` service
    * for a device that reports current consumption.
    * @param {!CharacteristicDelegate} params.computedConsumption - The
    * `eve.TotalConsumption` characteristic delegate
    * for a `hap.Outlet` or `eve.Consumption` service
    * for a device that reports current consumption, but not total consumption.
    * @param {!CharacteristicDelegate} params.consumptionDelegate - The
    * `.eve.TotalConsumption` characteristic delegate
    * for a `hap.Outlet` or `eve.Consumption` service
    * for a device that reports total consumption.
    * @param {?CharacteristicDelegate} params.computedPowerDelegate - The
    * `.eve.CurrentConsumption` characteristic delegate
    * for a `hap.Outlet` or `eve.Consumption` service
    * for a device that reports total consumption but not current consumption.
    * @param {integer} [params.memorySize=4032] - The memory size, in number of
    * history entries.  The default is 4 weeks of 1 entry per 10 minutes.
    * @param {?boolean} params.config - Expose config.
    */
  constructor (accessoryDelegate, params = {}) {
    params.name = accessoryDelegate.name + ' History'
    params.Service = accessoryDelegate.Services.eve.History
    params.hidden = true
    super(accessoryDelegate, params)

    const delegates = []
    let i = 0
    for (const param of Object.keys(params)) {
      if (param.endsWith('Delegate')) {
        if (!(params[param] instanceof CharacteristicDelegate)) {
          throw new TypeError(`params.${param}: not a CharacteristicDelegate`)
        }
        const key = param.slice(0, -8)
        if (historyDerivedTypes[key] != null) {
          if (params[historyDerivedTypes[key] + 'Delegate'] == null) {
            throw new SyntaxError(`params.${param}: missing params.${key}Delegate`)
          }
          this[param] = params[param]
          continue
        }
        if (key === 'lightOn') {
          if (!(params.lastLightOnDelegate instanceof CharacteristicDelegate)) {
            throw new SyntaxError(`params.${param}: missing params.${key}Delegate`)
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
      this._valueTypes.push(new historyValueTypes[key](this, params[param]))
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

  /** Return current time as # seconds since NodeJS epoch.
    * @returns {integer} # seconds since NodeJS epoch.
    */
  static now () { return Math.round(new Date().valueOf() / 1000) }

  /** Convert date intp `Characteristics.eve.LastActivation` characteristic value.
    * @param {integer} date - # seconds since NodeJS epoch.
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
    let mask = 0
    let o = 1
    for (const i in this._valueTypes) {
      const { id, length } = this._valueTypes[i]
      if (entry[id] != null) {
        mask |= 0x01 << i
        if (length === 1) {
          buffer.writeUInt8(entry[id], o)
        } else {
          buffer.writeUInt16LE(entry[id], o)
        }
        o += length
      }
    }
    buffer.writeUInt8(mask, 0)
    return buffer.slice(0, o)
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

module.exports = History
