/* jshint esversion: 6,node: true,-W041: false */
'use strict'

const fs = require('fs')
const moment = require('moment')
const util = require('util')
// const FakeGatoStorage = require('./fakegato-storage').FakeGatoStorage

const EPOCH_OFFSET = 978307200

const TYPE_ENERGY = 'energy'
const TYPE_ROOM = 'room'
const TYPE_WEATHER = 'weather'
const TYPE_DOOR = 'door'
const TYPE_MOTION = 'motion'
const TYPE_THERMO = 'thermo'
const TYPE_AQUA = 'aqua'

let Service
let Characteristic

module.exports = function (homebridge) {
  if (Service == null) {
    Characteristic = homebridge.hap.Characteristic
    Service = homebridge.hap.Service
  }

  var hexToBase64 = function (val) {
    return Buffer.from(('' + val).replace(/[^0-9A-F]/ig, ''), 'hex')
      .toString('base64')
  }

  var base64ToHex = function (val) {
    if (!val) {
      return val
    }
    return Buffer.from(val, 'base64').toString('hex')
  }

  var swap16 = function (val) {
    return ((val & 0xFF) << 8) | ((val >>> 8) & 0xFF)
  }

  var swap32 = function (val) {
    return ((val & 0xFF) << 24) | ((val & 0xFF00) << 8) |
      ((val >>> 8) & 0xFF00) | ((val >>> 24) & 0xFF)
  }

  var numToHex = function (val, len) {
    var s = Number(val >>> 0).toString(16)
    if (s.length % 2 !== 0) {
      s = '0' + s
    }
    if (len) {
      return ('0000000000000' + s).slice(-1 * len)
    }
    return s
  }

  class HistoryStatus extends Characteristic {
    constructor () {
      super('S2R1', HistoryStatus.UUID)
      this.setProps({
        format: Characteristic.Formats.DATA,
        perms: [
          Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.HIDDEN
        ]
      })
    }
  }

  HistoryStatus.UUID = 'E863F116-079E-48FF-8F27-9C2605A29F52'

  class HistoryEntries extends Characteristic {
    constructor () {
      super('S2R2', HistoryEntries.UUID)
      this.setProps({
        format: Characteristic.Formats.DATA,
        perms: [
          Characteristic.Perms.READ, Characteristic.Perms.NOTIFY, Characteristic.Perms.HIDDEN
        ]
      })
    }
  }

  HistoryEntries.UUID = 'E863F117-079E-48FF-8F27-9C2605A29F52'

  class HistoryRequest extends Characteristic {
    constructor () {
      super('S2W1', HistoryRequest.UUID)
      this.setProps({
        format: Characteristic.Formats.DATA,
        perms: [
          Characteristic.Perms.WRITE, Characteristic.Perms.HIDDEN
        ]
      })
    }
  }

  HistoryRequest.UUID = 'E863F11C-079E-48FF-8F27-9C2605A29F52'

  class SetTime extends Characteristic {
    constructor () {
      super('S2W2', SetTime.UUID)
      this.setProps({
        format: Characteristic.Formats.DATA,
        perms: [
          Characteristic.Perms.WRITE, Characteristic.Perms.HIDDEN
        ]
      })
    }
  }

  SetTime.UUID = 'E863F121-079E-48FF-8F27-9C2605A29F52'

  class FakeGatoHistoryService extends Service {
    constructor (displayName, subtype) {
      super(displayName, FakeGatoHistoryService.UUID, subtype)

      this.addCharacteristic(HistoryStatus)
      this.addCharacteristic(HistoryEntries)
      this.addCharacteristic(HistoryRequest)
      this.addCharacteristic(SetTime)
    }
  }

  FakeGatoHistoryService.UUID = 'E863F007-079E-48FF-8F27-9C2605A29F52'

  var thisAccessory = {}

  class FakeGatoHistory {
    constructor (accessoryType, accessory, optionalParams = {}) {
      this.size = optionalParams.size || 4032
      this.filename = optionalParams.path + '/' + optionalParams.filename

      thisAccessory = accessory
      this.accessoryName = thisAccessory.displayName
      this.debug = thisAccessory.debug

      this.loaded = false
      this.load((error, loaded) => {
        if (error) {
          this.debug('load error %s', error.message)
        }
        this.loaded = true
      })

      switch (accessoryType) {
        case TYPE_WEATHER:
          this.accessoryType116 = '03 0102 0202 0302'
          this.accessoryType117 = '07'
          break
        case TYPE_ENERGY:
          this.accessoryType116 = '04 0102 0202 0702 0f03'
          this.accessoryType117 = '1f'
          break
        case TYPE_ROOM:
          this.accessoryType116 = '04 0102 0202 0402 0f03'
          this.accessoryType117 = '0f'
          break
        case TYPE_DOOR:
          this.accessoryType116 = '01 0601'
          this.accessoryType117 = '01'
          break
        case TYPE_MOTION:
          this.accessoryType116 = '02 1301 1c01'
          this.accessoryType117 = '02'
          break
        case TYPE_AQUA:
          this.accessoryType116 = '03 1f01 2a08 2302'
          this.accessoryType117 = '05'
          this.accessoryType117bis = '07'
          break
        case TYPE_THERMO:
          this.accessoryType116 = '05 0102 1102 1001 1201 1d01'
          this.accessoryType117 = '1f'
          break
      }

      this.accessoryType = accessoryType
      this.firstEntry = 0
      this.lastEntry = 0
      this.history = ['noValue']
      this.memorySize = this.size
      this.usedMemory = 0
      this.currentEntry = 1
      this.transfer = false
      this.setTime = true
      this.restarted = true
      this.refTime = 0
      this.memoryAddress = 0
      this.dataStream = ''

      this.saving = false

      this.service = thisAccessory.getService(FakeGatoHistoryService)
      if (this.service == null) {
        this.service = thisAccessory.addService(FakeGatoHistoryService, thisAccessory.displayName, this.accessoryType)
      }
      this.service.getCharacteristic(HistoryEntries)
        .on('get', this.onGetHistoryEntries.bind(this))
      this.service.getCharacteristic(HistoryRequest)
        .on('set', this.onSetHistoryRequest.bind(this))
      this.service.getCharacteristic(SetTime)
        .on('set', this.onSetTime.bind(this))
    }

    addEntry (entry) {
      switch (this.accessoryType) {
        case TYPE_DOOR:
        case TYPE_MOTION:
          this._addEntry({ time: entry.time, status: entry.status })
          break
        case TYPE_AQUA:
          this._addEntry({ time: entry.time, status: entry.status, waterAmount: entry.waterAmount })
          break
        case TYPE_WEATHER:
          this._addEntry({ time: entry.time, temp: entry.temp, humidity: entry.humidity, pressure: entry.pressure })
          break
        case TYPE_ROOM:
          this._addEntry({ time: entry.time, temp: entry.temp, humidity: entry.humidity, ppm: entry.ppm })
          break
        case TYPE_ENERGY:
          this._addEntry({ time: entry.time, power: entry.power })
          break
        default:
          this._addEntry(entry)
          break
      }
    }

    // in order to be consistent with Eve, entry address start from 1
    _addEntry (entry) {
      if (this.loaded) {
        var entry2address = function (val) {
          return val % this.memorySize
        }
          .bind(this)

        var val

        if (this.usedMemory < this.memorySize) {
          this.usedMemory++
          this.firstEntry = 0
          this.lastEntry = this.usedMemory
        } else {
          this.firstEntry++
          this.lastEntry = this.firstEntry + this.usedMemory
          if (this.restarted === true) {
            this.history[entry2address(this.lastEntry)] = {
              time: entry.time,
              setRefTime: 1
            }
            this.firstEntry++
            this.lastEntry = this.firstEntry + this.usedMemory
            this.restarted = false
          }
        }

        if (this.refTime === 0) {
          this.refTime = entry.time - EPOCH_OFFSET
          this.history[this.lastEntry] = {
            time: entry.time,
            setRefTime: 1
          }
          this.initialTime = entry.time
          this.lastEntry++
          this.usedMemory++
        }

        this.history[entry2address(this.lastEntry)] = (entry)

        if (this.usedMemory < this.memorySize) {
          val = util.format(
            '%s00000000%s%s%s%s%s000000000101',
            numToHex(swap32(entry.time - this.refTime - EPOCH_OFFSET), 8),
            numToHex(swap32(this.refTime), 8),
            this.accessoryType116,
            numToHex(swap16(this.usedMemory + 1), 4),
            numToHex(swap16(this.memorySize), 4),
            numToHex(swap32(this.firstEntry), 8))
        } else {
          val = util.format(
            '%s00000000%s%s%s%s%s000000000101',
            numToHex(swap32(entry.time - this.refTime - EPOCH_OFFSET), 8),
            numToHex(swap32(this.refTime), 8),
            this.accessoryType116,
            numToHex(swap16(this.usedMemory), 4),
            numToHex(swap16(this.memorySize), 4),
            numToHex(swap32(this.firstEntry + 1), 8))
        }

        // this.debug('first entry: %d', this.firstEntry)
        // this.debug('last entry: %d', this.lastEntry)
        // this.debug('used memory: %d', this.usedMemory)
        // this.debug('set history status to: %s', val)
        this.debug('add entry %d: %j', this.lastEntry, entry)
        this.debug('set history status to: %s', hexToBase64(val))
        this.service.getCharacteristic(HistoryStatus).setValue(hexToBase64(val))
        this.save()
      } else {
        setTimeout(function () { // retry in 100ms
          this._addEntry(entry)
        }.bind(this), 100)
      }
    }
    getInitialTime () {
      return this.initialTime
    }

    isHistoryLoaded () {
      return this.loaded
    }

    save () {
      if (this.loaded) {
        let data = {
          firstEntry: this.firstEntry,
          lastEntry: this.lastEntry,
          usedMemory: this.usedMemory,
          refTime: this.refTime,
          initialTime: this.initialTime,
          history: this.history
        }
        fs.writeFile(this.filename, JSON.stringify(data), 'utf8', (error) => {
          if (error) {
            this.debug('%s: cannot write', this.filename)
          }
          this.debug('%s: %d entries', this.filename, this.usedMemory)
        })
      } else {
        setTimeout(function () { // retry in 100ms
          this.save()
        }.bind(this), 100)
      }
    }

    load (callback) {
      fs.readFile(this.filename, 'utf8', (error, data) => {
        if (error) {
          this.debug('%s: not found', this.filename)
          return callback(null, false)
        }
        if (data == null) {
          this.debug('%s: 0 entries', this.filename)
          return callback(null, true)
        }
        try {
          let jsonFile = JSON.parse(data)
          this.firstEntry = jsonFile.firstEntry
          this.lastEntry = jsonFile.lastEntry
          this.usedMemory = jsonFile.usedMemory
          this.refTime = jsonFile.refTime
          this.initialTime = jsonFile.initialTime
          this.history = jsonFile.history
          this.debug('%s: %d entries', this.filename, this.usedMemory)
        } catch (error) {
          this.debug('%s: cannot read', this.filename, error)
          callback(error, false)
        }
        callback(null, true)
      })
    }

    onGetHistoryEntries (callback) {
      var entry2address = function (val) {
        return val % this.memorySize
      }.bind(this)

      if ((this.currentEntry <= this.lastEntry) && (this.transfer === true)) {
        this.memoryAddress = entry2address(this.currentEntry)
        for (var i = 0; i < 11; i++) {
          if (
            (this.history[this.memoryAddress].setRefTime === 1) || (this.setTime === true) ||
            (this.currentEntry === this.firstEntry + 1)
          ) {
            this.debug('entry: %s, reftime: %s (%s)', this.currentEntry, this.refTime, moment.unix(this.refTime + EPOCH_OFFSET))
            this.dataStream += util.format(
              ' 15%s 0100 0000 81%s0000 0000 00 0000',
              numToHex(swap32(this.currentEntry), 8),
              numToHex(swap32(this.refTime), 8))
            this.setTime = false
          } else {
            this.debug('entry: %s, address: %s, time: %s (%s)', this.currentEntry, this.memoryAddress, this.history[this.memoryAddress].time - this.refTime - EPOCH_OFFSET, moment.unix(this.history[this.memoryAddress].time))
            switch (this.accessoryType) {
              case TYPE_WEATHER:
                this.dataStream += util.format(
                  ' 10 %s%s%s%s%s%s',
                  numToHex(swap32(this.currentEntry), 8),
                  numToHex(swap32(this.history[this.memoryAddress].time - this.refTime - EPOCH_OFFSET), 8),
                  this.accessoryType117,
                  numToHex(swap16(this.history[this.memoryAddress].temp * 100), 4),
                  numToHex(swap16(this.history[this.memoryAddress].humidity * 100), 4),
                  numToHex(swap16(this.history[this.memoryAddress].pressure * 10), 4))
                break
              case TYPE_ENERGY:
                this.dataStream += util.format(
                  ' 14 %s%s%s0000 0000%s0000 0000',
                  numToHex(swap32(this.currentEntry), 8),
                  numToHex(swap32(this.history[this.memoryAddress].time - this.refTime - EPOCH_OFFSET), 8),
                  this.accessoryType117,
                  numToHex(swap16(this.history[this.memoryAddress].power * 10), 4))
                break
              case TYPE_ROOM:
                this.dataStream += util.format(
                  ' 13 %s%s%s%s%s%s0000 00',
                  numToHex(swap32(this.currentEntry), 8),
                  numToHex(swap32(this.history[this.memoryAddress].time - this.refTime - EPOCH_OFFSET), 8),
                  this.accessoryType117,
                  numToHex(swap16(this.history[this.memoryAddress].temp * 100), 4),
                  numToHex(swap16(this.history[this.memoryAddress].humidity * 100), 4),
                  numToHex(swap16(this.history[this.memoryAddress].ppm), 4))
                break
              case TYPE_DOOR:
              case TYPE_MOTION:
                this.dataStream += util.format(
                  ' 0b %s%s%s%s',
                  numToHex(swap32(this.currentEntry), 8),
                  numToHex(swap32(this.history[this.memoryAddress].time - this.refTime - EPOCH_OFFSET), 8),
                  this.accessoryType117,
                  numToHex(this.history[this.memoryAddress].status, 2))
                break
              case TYPE_AQUA:
                if (this.history[this.memoryAddress].status === true) {
                  this.dataStream += util.format(
                    ' 0d %s%s%s%s 300c',
                    numToHex(swap32(this.currentEntry), 8),
                    numToHex(swap32(this.history[this.memoryAddress].time - this.refTime - EPOCH_OFFSET), 8),
                    this.accessoryType117,
                    numToHex(this.history[this.memoryAddress].status, 2))
                } else {
                  this.dataStream += util.format(
                    ' 15 %s%s%s%s%s 00000000 300c',
                    numToHex(swap32(this.currentEntry), 8),
                    numToHex(swap32(this.history[this.memoryAddress].time - this.refTime - EPOCH_OFFSET), 8),
                    this.accessoryType117bis,
                    numToHex(this.history[this.memoryAddress].status, 2),
                    numToHex(swap32(this.history[this.memoryAddress].waterAmount), 8))
                }
                break
              case TYPE_THERMO:
                this.dataStream += util.format(
                  ' 11 %s%s%s%s%s%s 0000',
                  numToHex(swap32(this.currentEntry), 8),
                  numToHex(swap32(this.history[this.memoryAddress].time - this.refTime - EPOCH_OFFSET), 8),
                  this.accessoryType117,
                  numToHex(swap16(this.history[this.memoryAddress].currentTemp * 100), 4),
                  numToHex(swap16(this.history[this.memoryAddress].setTemp * 100), 4),
                  numToHex(this.history[this.memoryAddress].valvePosition, 2))
                break
            }
          }
          this.currentEntry++
          this.memoryAddress = entry2address(this.currentEntry)
          if (this.currentEntry > this.lastEntry) { break }
        }
        // this.debug('send data %s', this.dataStream)
        this.debug('send data %s', hexToBase64(this.dataStream))
        callback(null, hexToBase64(this.dataStream))
        this.dataStream = ''
      } else {
        this.debug('send data %s', hexToBase64('00'))
        this.transfer = false
        callback(null, hexToBase64('00'))
      }
    }

    onSetHistoryRequest (val, callback) {
      callback(null, val)
      const address = swap32(parseInt(base64ToHex(val).substring(4, 12), 16))
      this.debug('request %s (address: %d)', val, address)
      if (address !== 0) {
        this.currentEntry = address
      } else {
        this.currentEntry = 1
      }
      this.transfer = true
    }

    onSetTime (val, callback) {
      this.debug('set time: %s', val)
      // this.debug('set time: %s', base64ToHex(val))
      callback(null, val)
    }
  }

  return FakeGatoHistory
}
