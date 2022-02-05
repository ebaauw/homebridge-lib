// homebridge-lib/lib/ServiceDelegate/History/index.js
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

const util = require('util')

/** Eve history keeps time as # seconds since epoch of 2001/01/01.
  * @type {integer}
  */
const epoch = Math.round(new Date('2001-01-01T00:00:00Z').valueOf() / 1000)

/** Convert Eve date (in # seconds since epoch) to string.
  * @param {integer} d - Eve date as # seconds since epoch.
  * @returns {string} Human readable date string.
  */
function dateToString (d) {
  return new Date(1000 * (epoch + d)).toString().slice(0, 24)
}

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

/** Abstract superclass for an Eve _History_ service delegate.
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
  static get Consumption () { return require('./Consumption') }
  static get Contact () { return require('./Contact') }
  static get Motion () { return require('./Motion') }
  static get On () { return require('./On') }
  static get Power () { return require('./Power') }
  static get Room () { return require('./Room') }
  static get Thermo () { return require('./Thermo') }
  static get Weather () { return require('./Weather') }

  static get hexToBase64 () { return hexToBase64 }
  static get base64ToHex () { return base64ToHex }
  static get swap16 () { return swap16 }
  static get swap32 () { return swap32 }
  static get numToHex () { return numToHex }

  /** Create a new instance of an Eve _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    */
  constructor (accessoryDelegate, params = {}) {
    params.name = accessoryDelegate.name + ' History'
    params.Service = accessoryDelegate.Services.eve.History
    params.hidden = true
    super(accessoryDelegate, params)
    this._memorySize = 6 * 24 * 7 * 4 // Four weeks.
    this._transfer = false
    this._restarted = true

    this.addCharacteristicDelegate({
      key: 'history',
      silent: true
    })
    if (this.context._history != null) {
      this.values.history = this.context._history
      delete this.context._history
    }
    this._h = this.values.history
    if (this._h == null) {
      this.values.history = {
        firstEntry: 0,
        lastEntry: 0,
        history: ['noValue'],
        usedMemory: 0,
        currentEntry: 1,
        initialTime: 0
      }
      this._h = this.values.history
    } else {
      this.debug('restored %d history entries', this._h.usedMemory)
    }
    if (this._h.refTime != null) {
      this._h.initialTime = this._h.refTime + epoch
      delete this._h.refTime
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
      this.debug('SetTime changed to %j', buffer.toString('hex'))
      const date = dateToString(buffer.readUInt32LE())
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

    // this.addCharacteristicDelegate({
    //   key: 'configCommand',
    //   Characteristic: this.Characteristics.eve.ConfigCommand,
    //   setter: this._onSetConfig.bind(this)
    //   // silent: true
    // })

    // this.addCharacteristicDelegate({
    //   key: 'configData',
    //   Characteristic: this.Characteristics.eve.ConfigData,
    //   getter: this._onGetConfig.bind(this)
    //   // silent: true
    // })

    this._accessoryDelegate.heartbeatEnabled = true
    this._accessoryDelegate
      .once('heartbeat', (beat) => {
        this._historyBeat = (beat % 600) + 5
      })
      .on('heartbeat', this._heartbeat.bind(this))
      .on('shutdown', () => {
        this.debug('saved %d history entries', this._h.usedMemory)
      })
  }

  _addEntry (now = Math.round(new Date().valueOf() / 1000)) {
    this._entry.time = now
    if (this._h.usedMemory < this._memorySize) {
      this._h.usedMemory++
      this._h.firstEntry = 0
      this._h.lastEntry = this._h.usedMemory
    } else {
      this._h.firstEntry++
      this._h.lastEntry = this._h.firstEntry + this._h.usedMemory
      if (this._restarted === true) {
        this._h.history[this._h.lastEntry % this._memorySize] = {
          time: this._entry.time,
          setRefTime: 1
        }
        this._h.firstEntry++
        this._h.lastEntry = this._h.firstEntry + this._h.usedMemory
        this._restarted = false
      }
    }

    if (this._h.initialTime === 0) {
      this._h.history[this._h.lastEntry] = {
        time: this._entry.time,
        setRefTime: 1
      }
      this._h.initialTime = this._entry.time
      this._h.lastEntry++
      this._h.usedMemory++
    }

    this._h.history[this._h.lastEntry % this._memorySize] =
      Object.assign({}, this._entry)

    const usedMemeoryOffset = this._h.usedMemory < this._memorySize ? 1 : 0
    const firstEntryOffset = this._h.usedMemory < this._memorySize ? 0 : 1

    // const buffer = Buffer.alloc(1024)
    // let offset = 0
    // buffer.writeUInt32LE(this._entry.time - this._h.initialTime, offset)
    // offset += 4
    // buffer.writeUInt32LE(0, offset)
    // offset += 4
    // buffer.writeUInt32LE(this._h.initialTime - epoch, offset)
    // offset += 4
    // buffer.write(this._fingerPrint.replace(/[^0-9A-F]/ig, ''), offset, 'hex')
    // const length = 1 + 2 * parseInt(this._fingerPrint.slice(0, 2))
    // this.debug('fingerprint length: %d', length)
    // offset += length
    // buffer.writeUInt16LE(this._h.usedMemory + usedMemeoryOffset, offset)
    // offset += 2
    // buffer.writeUInt16LE(this._memorySize, offset)
    // offset += 2
    // buffer.writeUInt32LE(this._h.firstEntry + firstEntryOffset, offset)
    // offset += 4
    // buffer.writeUInt32LE(0, offset)
    // offset += 4
    // buffer.writeUint8(1, offset)
    // offset += 1
    // buffer.writeUint8(1, offset)
    // offset += 1

    const value = util.format(
      '%s 00000000 %s [%s] %s %s %s 000000000101',
      numToHex(swap32(this._entry.time - this._h.initialTime), 8),
      numToHex(swap32(this._h.initialTime - epoch), 8),
      this._fingerPrint,
      numToHex(swap16(this._h.usedMemory + usedMemeoryOffset), 4),
      numToHex(swap16(this._memorySize), 4),
      numToHex(swap32(this._h.firstEntry + firstEntryOffset), 8)
    )

    this.debug('add entry %d: %j', this._h.lastEntry, this._entry)
    this.debug('set history status to: %j', value)
    // this.debug('set history status to: %j', buffer.slice(0, offset).toString('hex'))
    this.values.historyStatus = hexToBase64(value)
  }

  _heartbeat (beat) {
    if (beat % 600 === this._historyBeat) {
      this._addEntry()
    }
  }

  async _onSetHistoryRequest (value) {
    const buffer = Buffer.from(value, 'base64')
    this.debug('History Request changed to %j', base64ToHex(value))
    const entry = buffer.readUInt32LE(2)
    this.debug('request entry: %d', entry)
    if (entry !== 0) {
      this._h.currentEntry = entry
    } else {
      this._h.currentEntry = 1
    }
    this._transfer = true
  }

  async _onGetEntries () {
    if (this._h.currentEntry > this._h.lastEntry || !this._transfer) {
      this.debug('send data: 00')
      this._transfer = false
      return hexToBase64('00')
    }

    let dataStream = ''
    for (let i = 0; i < 11; i++) {
      const address = this._h.currentEntry % this._memorySize
      if (
        this._h.history[address].setRefTime === 1 ||
        this._h.currentEntry === this._h.firstEntry + 1
      ) {
        this.debug(
          'entry: %s, address %s, reftime: %s (%s)', this._h.currentEntry,
          address, this._h.initialTime - epoch,
          new Date(1000 * this._h.initialTime).toString().slice(0, 24)
        )
        dataStream += util.format(
          '|15 %s 0100000081 %s 00000000000000',
          numToHex(swap32(this._h.currentEntry), 8),
          numToHex(swap32(this._h.initialTime - epoch), 8))
      } else {
        this.debug(
          'entry: %s, address: %s, time: %s (%s)', this._h.currentEntry,
          address, this._h.history[address].time - this._h.initialTime,
          new Date(1000 * this._h.history[address].time).toString().slice(0, 24)
        )
        dataStream += this._entryStream(this._h.history[address])
      }
      this._h.currentEntry++
      if (this._h.currentEntry > this._h.lastEntry) {
        break
      }
    }
    this.debug('send data: %s', dataStream)
    return hexToBase64(dataStream)
  }

  // async _onGetConfig () {
  //   return hexToBase64('D200')
  // }

  // async _onSetConfig () {
  // }
}

module.exports = History
