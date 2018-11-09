// homebridge-lib/lib/LibService.js
//
// Library for homebridge plug-ins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.
//
// The logic for handling Eve history was copied from Simone Tisa's
// fakagato-history repository, copyright © 2017 simont77.
// See https://github.com/simont77/fakegato-history.
//
// See https://github.com/ebaauw/homebridge-lib/wiki/LibService.

'use strict'

const fs = require('fs')
const moment = require('moment')
const util = require('util')

const homebridgeLib = {
  LibCharacteristic: require('./LibCharacteristic'),
  LibObject: require('./LibObject')
}

const epoch = moment('2001-01-01T00:00:00Z').unix()

function hexToBase64 (value) {
  if (value == null || typeof value !== 'string') {
    throw new TypeError('value: not a string')
  }
  return Buffer.from((value).replace(/[^0-9A-F]/ig, ''), 'hex')
    .toString('base64')
}

function base64ToHex (value) {
  if (value == null || typeof value !== 'string') {
    throw new TypeError('value: not a string')
  }
  return Buffer.from(value, 'base64').toString('hex')
}

function swap16 (value) {
  return ((value & 0xFF) << 8) | ((value >>> 8) & 0xFF)
}

function swap32 (value) {
  return ((value & 0xFF) << 24) | ((value & 0xFF00) << 8) |
    ((value >>> 8) & 0xFF00) | ((value >>> 24) & 0xFF)
}

function numToHex (value, length) {
  let s = Number(value >>> 0).toString(16)
  if (s.length % 2 !== 0) {
    s = '0' + s
  }
  if (length) {
    return ('0000000000000' + s).slice(-length)
  }
  return s
}

// Delegate for Service.
module.exports = class LibService extends homebridgeLib.LibObject {
  constructor (accessoryDelegate, params = {}) {
    if (!(accessoryDelegate instanceof require('./LibAccessory'))) {
      throw new TypeError('parent: not a LibAccessory')
    }
    if (params.name == null) {
      throw new SyntaxError('params.name: missing')
    }
    super(accessoryDelegate._platform, params.name)
    if (
      typeof params.Service !== 'function' ||
      typeof params.Service.UUID !== 'string'
    ) {
      throw new TypeError('params.Service: not a Service')
    }
    this._accessoryDelegate = accessoryDelegate
    const Service = params.Service
    const subtype = params._subtype
    const id = subtype ? [Service.UUID, subtype].join('.') : Service.UUID

    // Get or create associated Service.
    this._service = subtype
      ? accessoryDelegate._accessory.getServiceByUUIDAndSubType(Service, subtype)
      : accessoryDelegate._accessory.getService(Service)
    if (this._service == null) {
      this._service = accessoryDelegate._accessory.addService(
        new Service(this.name, subtype)
      )
    }

    // Setup persisted storage in ~/.homebridge/accessories/cachedAccessories.
    if (accessoryDelegate._accessory.context[id] == null) {
      accessoryDelegate._accessory.context[id] = {}
    }
    this._context = accessoryDelegate._accessory.context[id]

    // Setup shortcut for characteristic values.
    this.values = {}

    // Setup characteristics
    this._characteristicDelegates = {}
    for (const characteristic of this._characteristics.concat(this.characteristics)) {
      const key = characteristic.key
      if (characteristic.value == null) {
        characteristic.value = params[key]
      }
      if (!characteristic.isOptional || characteristic.value != null) {
        // Create characteristic delegate.
        const characteristicDelegate = new homebridgeLib.LibCharacteristic(
          this, characteristic
        )
        this._characteristicDelegates[key] = characteristicDelegate
        // Create shortcut for characteristic value.
        Object.defineProperty(this.values, key, {
          writeable: true,
          get () { return characteristicDelegate.value },
          set (value) { characteristicDelegate.value = value }
        })
      }
    }

    // Setup name
    this.name = params.name
  }

  get _characteristics () {
    return [
      { key: 'name', Characteristic: this.Characteristic.hap.Name }
    ]
  }
  get characteristics () {
    return []
  }

  get name () {
    return super.name
  }
  set name (name) {
    super.name = name
    if (this._service != null) {
      this._service.displayName = name
    }
    if (this.values != null && this.values.name != null) {
      this.values.name = name
    }
  }

  characteristicDelegate (key) {
    return this._characteristicDelegates[key]
  }

  // ===== Accessory Information ===============================================

  static get AccessoryInformation () {
    return class AccessoryInformation extends LibService {
      constructor (accessoryDelegate, params = {}) {
        params.name = accessoryDelegate.name
        params.Service = accessoryDelegate.Service.hap.AccessoryInformation
        super(accessoryDelegate, params)
      }

      get _characteristics () {
        return super._characteristics.concat([
          {
            key: 'id',
            Characteristic: this.Characteristic.hap.SerialNumber
          },
          {
            key: 'manufacturer',
            Characteristic: this.Characteristic.hap.Manufacturer
          },
          {
            key: 'model',
            Characteristic: this.Characteristic.hap.Model
          },
          {
            key: 'firmware',
            Characteristic: this.Characteristic.hap.FirmwareRevision
          },
          {
            key: 'hardware',
            Characteristic: this.Characteristic.hap.HardwareRevision,
            isOptional: true
          },
          {
            key: 'software',
            Characteristic: this.Characteristic.hap.SoftwareRevision,
            isOptional: true
          }
        ])
      }
    }
  }

  // ===== History =============================================================

  static get History () {
    return class History extends LibService {
      constructor (accessoryDelegate, params = {}) {
        params.name = accessoryDelegate.name + ' History'
        params.Service = accessoryDelegate.Service.eve.History
        super(accessoryDelegate, params)
        this._filename = this._platform._homebridge.user.storagePath() +
          '/accessories/history_' + params.id + '.json'
        this._accessoryDelegate._context.historyFile = this._filename
        this._firstEntry = 0
        this._lastEntry = 0
        this._history = ['noValue']
        this._memorySize = 4032
        this._usedMemory = 0
        this._currentEntry = 1
        this._transfer = false
        this._setTime = true
        this._restarted = true
        this._refTime = 0

        this._characteristicDelegates.historyRequest
          .on('didSet', this._onSetHistoryRequest.bind(this))
        this._characteristicDelegates.historyEntries._characteristic
          .on('get', this._onGetEntries.bind(this))
        this._accessoryDelegate.on('heartbeat', this._heartbeat.bind(this))
        this._accessoryDelegate._platform.on('shutdown', this._save.bind(this))
        this._load()
      }

      get _characteristics () {
        return super._characteristics.concat([
          { key: 'historyRequest', Characteristic: this.Characteristic.eve.HistoryRequest },
          { key: 'setTime', Characteristic: this.Characteristic.eve.SetTime },
          { key: 'historyStatus', Characteristic: this.Characteristic.eve.HistoryStatus },
          { key: 'historyEntries', Characteristic: this.Characteristic.eve.HistoryEntries }
        ])
      }

      _addEntry (now = moment().unix()) {
        if (this.loading) {
          setTimeout(() => {
            this._addEntry(now)
          }, 100)
          return
        }
        this._entry.time = now
        if (this._usedMemory < this._memorySize) {
          this._usedMemory++
          this._firstEntry = 0
          this._lastEntry = this._usedMemory
        } else {
          this._firstEntry++
          this._lastEntry = this._firstEntry + this._usedMemory
          if (this._restarted === true) {
            this._history[this._lastEntry % this._memorySize] = {
              time: this._entry.time,
              setRefTime: 1
            }
            this._firstEntry++
            this._lastEntry = this._firstEntry + this._usedMemory
            this._restarted = false
          }
        }

        if (this._refTime === 0) {
          this._refTime = this._entry.time - epoch
          this._history[this._lastEntry] = {
            time: this._entry.time,
            setRefTime: 1
          }
          this._initialTime = this._entry.time
          this._lastEntry++
          this._usedMemory++
        }

        this._history[this._lastEntry % this._memorySize] = this._entry

        const usedMemeoryOffset = this._usedMemory < this._memorySize ? 1 : 0
        const firstEntryOffset = this._usedMemory < this._memorySize ? 0 : 1
        const value = util.format(
          '%s00000000%s%s%s%s%s000000000101',
          numToHex(swap32(this._entry.time - this._refTime - epoch), 8),
          numToHex(swap32(this._refTime), 8),
          this._fingerPrint,
          numToHex(swap16(this._usedMemory + usedMemeoryOffset), 4),
          numToHex(swap16(this._memorySize), 4),
          numToHex(swap32(this._firstEntry + firstEntryOffset), 8))

        // this.debug('first entry: %d', this._firstEntry)
        // this.debug('last entry: %d', this._lastEntry)
        // this.debug('used memory: %d', this._usedMemory)
        this.debug('add entry %d: %j', this._lastEntry, this._entry)
        this.debug('set history status to: %s', value)
        this.values.historyStatus = hexToBase64(value)
        // this._save()
      }

      _heartbeat (beat) {
        if (beat % 600 === 5) {
          this._addEntry()
        }
      }

      _onSetHistoryRequest (value) {
        const entry = swap32(parseInt(base64ToHex(value).substring(4, 12), 16))
        this.debug('request entry: %d', entry)
        if (entry !== 0) {
          this._currentEntry = entry
        } else {
          this._currentEntry = 1
        }
        this._transfer = true
      }

      _onGetEntries (callback) {
        if (this._currentEntry > this._lastEntry | !this._transfer) {
          this.debug('send data %s', hexToBase64('00'))
          this._transfer = false
          return callback(null, hexToBase64('00'))
        }

        let dataStream = ''
        for (let i = 0; i < 11; i++) {
          const address = this._currentEntry % this._memorySize
          if (
            (this._history[address].setRefTime === 1) ||
            (this._setTime === true) ||
            (this._currentEntry === this._firstEntry + 1)
          ) {
            this.debug(
              'entry: %s, reftime: %s (%s)', this._currentEntry, this._refTime,
              moment.unix(this._refTime + epoch)
            )
            dataStream += util.format(
              ' 15%s 0100 0000 81%s0000 0000 00 0000',
              numToHex(swap32(this._currentEntry), 8),
              numToHex(swap32(this._refTime), 8))
            this._setTime = false
          } else {
            this.debug(
              'entry: %s, address: %s, time: %s (%s)', this._currentEntry,
              address, this._history[address].time - this._refTime - epoch,
              moment.unix(this._history[address].time)
            )
            dataStream += this._entryStream(this._history[address])
          }
          this._currentEntry++
          if (this._currentEntry > this._lastEntry) {
            break
          }
        }
        this.debug('send data %s', dataStream)
        this.debug('send data %s', hexToBase64(dataStream))
        callback(null, hexToBase64(dataStream))
      }

      _save () {
        if (this._loading) {
          setTimeout(() => {
            this._save()
          }, 100)
        }
        const data = {
          firstEntry: this._firstEntry,
          lastEntry: this._lastEntry,
          usedMemory: this._usedMemory,
          refTime: this._refTime,
          initialTime: this._initialTime,
          history: this._history
        }
        fs.writeFile(this._filename, JSON.stringify(data), 'utf8', (error) => {
          if (error) {
            this.error('%s: cannot write', this._filename)
          }
          this.debug('%s: %d entries', this._filename, this._usedMemory)
        })
      }

      _load () {
        this._loading = true
        fs.readFile(this._filename, 'utf8', (error, data) => {
          this._loading = false
          if (error) {
            this.debug('%s: not found', this._filename)
            return
          }
          if (data == null) {
            this.debug('%s: 0 entries', this._filename)
            return
          }
          try {
            let jsonFile = JSON.parse(data)
            this._firstEntry = jsonFile.firstEntry
            this._lastEntry = jsonFile.lastEntry
            this._usedMemory = jsonFile.usedMemory
            this._refTime = jsonFile.refTime
            this._initialTime = jsonFile.initialTime
            this._history = jsonFile.history
            this.debug('%s: %d entries', this._filename, this._usedMemory)
          } catch (error) {
            this.error('%s: cannot read', this._filename, error)
          }
        })
      }

      // Sensor deliveres totalConsumption, optionally compute currentCosumption
      static get Consumption () {
        return class Consumption extends LibService.History {
          constructor (
            accessoryDelegate, params = {},
            consumptionDelegate, powerDelegate
          ) {
            super(accessoryDelegate, params)
            if (!(consumptionDelegate instanceof homebridgeLib.LibCharacteristic)) {
              throw new TypeError('consumptionDelegate: not a LibCharacteristic')
            }
            if (
              powerDelegate != null &&
              !(powerDelegate instanceof homebridgeLib.LibCharacteristic)
            ) {
              throw new TypeError('powerDelegate: not a LibCharacteristic')
            }
            this._consumptionDelegate = consumptionDelegate
            this._powerDelegate = powerDelegate
            this._entry = { time: 0, power: 0 }
          }
          _addEntry () {
            if (this._consumption != null) {
              const delta = this._consumptionDelegate.value - this._consumption // Wh
              if (this._powerDelegate != null) {
                this._powerDelegate.value = delta
              }
              this._entry.power = delta * 6 // W * 10 min
              super._addEntry()
            }
            this._consumption = this._consumptionDelegate.value
          }
          get _fingerPrint () { return '04 0102 0202 0702 0f03' }
          _entryStream (entry) {
            return util.format(
              ' 14 %s%s1f0000 0000%s0000 0000',
              numToHex(swap32(this._currentEntry), 8),
              numToHex(swap32(entry.time - this._refTime - epoch), 8),
              numToHex(swap16(entry.power * 10), 4)
            )
          }
        }
      }

      static get Contact () {
        return class Contact extends LibService.History {
          constructor (
            accessoryDelegate, params = {},
            contactDelegate, timesOpenedDelegate, lastActivationDelegate
          ) {
            super(accessoryDelegate, params)
            if (!(contactDelegate instanceof homebridgeLib.LibCharacteristic)) {
              throw new TypeError('contactDelegate: not a LibCharacteristic')
            }
            if (!(timesOpenedDelegate instanceof homebridgeLib.LibCharacteristic)) {
              throw new TypeError('timesOpenedDelegate: not a LibCharacteristic')
            }
            if (!(lastActivationDelegate instanceof homebridgeLib.LibCharacteristic)) {
              throw new TypeError('lastActivationDelegate: not a LibCharacteristic')
            }
            this._entry = { time: 0, status: contactDelegate.value }
            contactDelegate.on('didSet', (value) => {
              const now = moment.unix()
              timesOpenedDelegate.value += value
              lastActivationDelegate.value = now - this._initialTime
              this._entry.status = value
              this._addEntry(now)
            })
            this._characteristicDelegates.resetTotal.on('didSet', (value) => {
              timesOpenedDelegate.value = 0
            })
          }
          get _characteristics () {
            return super._characteristics.concat([
              { key: 'resetTotal', Characteristic: this.Characteristic.eve.ResetTotal }
            ])
          }
          get _fingerPrint () { return '01 0601' }
          _entryStream (entry) {
            return util.format(
              ' 0b %s%s01%s',
              numToHex(swap32(this._currentEntry), 8),
              numToHex(swap32(entry.time - this._refTime - epoch), 8),
              numToHex(entry.status, 2)
            )
          }
        }
      }

      static get Motion () {
        return class Motion extends LibService.History {
          constructor (
            accessoryDelegate, params = {},
            motionDelegate, lastActivationDelegate
          ) {
            super(accessoryDelegate, params)
            if (!(motionDelegate instanceof homebridgeLib.LibCharacteristic)) {
              throw new TypeError('motionDelegate: not a LibCharacteristic')
            }
            if (!(lastActivationDelegate instanceof homebridgeLib.LibCharacteristic)) {
              throw new TypeError('lastActivationDelegate: not a LibCharacteristic')
            }
            this._entry = { time: 0, status: motionDelegate.value }
            motionDelegate.on('didSet', (value) => {
              const now = moment.unix()
              lastActivationDelegate.value = now - this._initialTime
              this._entry.status = value
              this._addEntry(now)
            })
          }
          get _fingerPrint () { return '02 1301 1c01' }
          _entryStream (entry) {
            return util.format(
              ' 0b %s%s02%s',
              numToHex(swap32(this._currentEntry), 8),
              numToHex(swap32(entry.time - this._refTime - epoch), 8),
              numToHex(entry.status, 2)
            )
          }
        }
      }

      // Sensor delivers currentConsumption, compute totalConsumption
      static get Power () {
        return class Power extends LibService.History {
          constructor (
            accessoryDelegate, params = {},
            powerDelegate, consumptionDelegate
          ) {
            super(accessoryDelegate, params)
            if (!(powerDelegate instanceof homebridgeLib.LibCharacteristic)) {
              throw new TypeError('powerDelegate: not a LibCharacteristic')
            }
            if (!(consumptionDelegate instanceof homebridgeLib.LibCharacteristic)) {
              throw new TypeError('consumptionDelegate: not a LibCharacteristic')
            }
            this._powerDelegate = powerDelegate
            this._consumptionDelegate = consumptionDelegate
            this._entry = { time: 0, power: 0 }
            this._runningConsumption = 0 // 10-min-interval running value
            this._totalConsumption = consumptionDelegate.value // life-time value
            powerDelegate.on('didSet', (value) => {
              const now = moment.unix()
              if (this._time != null) {
                const delta = this._power * (now - this._time) // Ws
                this._runningConsumption += Math.round(delta / 600.0) // W * 10 min
                this._totalConsumption += Math.round(delta / 3600.0) // Wh
              }
              this._power = value
              this._time = now
            })
            this._characteristicDelegates.resetTotal.on('didSet', (value) => {
              this._runningConsumption = 0
              this._totalConsumption = 0
              this._consumptionDelegate.value = this._totalConsumption
            })
          }
          get _characteristics () {
            return super._characteristics.concat([
              { key: 'resetTotal', Characteristic: this.Characteristic.eve.ResetTotal }
            ])
          }
          _addEntry () {
            const now = moment.unix()
            if (this._time != null) {
              const delta = this._power * (now - this._time) // Ws
              this._runningConsumption += Math.round(delta / 600.0) // W * 10 min
              this._totalConsumption += Math.round(delta / 3600.0) // Wh
              this._consumptionDelegate.value = this._totalConsumption
              this._entry.power = this._runningConsumption
              super._addEntry(now)
            }
            this._power = this._powerDelegate.value
            this._time = now
            this._runningConsumption = 0
          }
          get _fingerPrint () { return '04 0102 0202 0702 0f03' }
          _entryStream (entry) {
            return util.format(
              ' 14 %s%s1f0000 0000%s0000 0000',
              numToHex(swap32(this._currentEntry), 8),
              numToHex(swap32(entry.time - this._refTime - epoch), 8),
              numToHex(swap16(entry.power * 10), 4)
            )
          }
        }
      }

      static get Weather () {
        return class Weather extends LibService.History {
          constructor (
            accessoryDelegate, params = {},
            temperatureDelegate, humidityDelegate, pressureDelegate
          ) {
            super(accessoryDelegate, params)
            if (!(temperatureDelegate instanceof homebridgeLib.LibCharacteristic)) {
              throw new TypeError('temperatureDelegate: not a LibCharacteristic')
            }
            if (!(humidityDelegate instanceof homebridgeLib.LibCharacteristic)) {
              throw new TypeError('humidityDelegate: not a LibCharacteristic')
            }
            if (!(pressureDelegate instanceof homebridgeLib.LibCharacteristic)) {
              throw new TypeError('pressureDelegate: not a LibCharacteristic')
            }
            this._entry = {
              time: 0,
              temp: temperatureDelegate.value,
              humidity: humidityDelegate.value,
              pressure: pressureDelegate.value
            }
            temperatureDelegate
              .on('didSet', (value) => { this._entry.temp = value })
            humidityDelegate
              .on('didSet', (value) => { this._entry.humidity = value })
            pressureDelegate
              .on('didSet', (value) => { this._entry.pressure = value })
          }
          get _fingerPrint () { return '03 0102 0202 0302' }
          _entryStream (entry) {
            return util.format(
              ' 10 %s%s07%s%s%s',
              numToHex(swap32(this._currentEntry), 8),
              numToHex(swap32(entry.time - this._refTime - epoch), 8),
              numToHex(swap16(entry.temp * 100), 4),
              numToHex(swap16(entry.humidity * 100), 4),
              numToHex(swap16(entry.pressure * 10), 4)
            )
          }
        }
      }
    }
  }
}
