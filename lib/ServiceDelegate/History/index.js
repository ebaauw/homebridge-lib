// homebridge-lib/lib/ServiceDelegate/History/index.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2022 Erik Baauw. All rights reserved.
//
// The logic for handling Eve history was inspired by Simone Tisa's
// fakagato-history repository, copyright © 2017 simont77.
// See https://github.com/simont77/fakegato-history.

'use strict'

const homebridgeLib = require('../../../index')

const { ServiceDelegate } = homebridgeLib

/** Eve history keeps time as # seconds since epoch of 2001/01/01.
  * @type {integer}
  */
const epoch = Math.round(new Date('2001-01-01T00:00:00Z').valueOf() / 1000)

const defaultMemorySize = 6 * 24 * 7 * 4 // 4 weeks of 1 entry per 10 minutes

// const historyEntryTypes = {
//   airPressure: { tag: 0x03, length: 2 },
//   consumption: { tag: 0x07, length: 2 },
//   contact: { tag: 0x06, length: 1, event: true },
//   humidity: { tag: 0x02, length: 2 },
//   lastActivation: { },
//   lightLevel: { tag: 0x30, length: 2 },
//   motion: { tag: 0x1C, length: 1, event: true },
//   on: { tag: 0x0E, length: 1, event: true },
//   power: { tag: 0x07, length: 2 },
//   targetTemperature: { tag: 0x11, length: 2 },
//   currentTemperature: { tag: 0x01, length: 2 },
//   timesOpened: { },
//   totalConsumption: { },
//   valvePosition: { tag: 0x10, length: 1 },
//   vocDensity: { tag: 0x22, length: 2 }
// }

/** Convert Eve date (in # seconds since epoch) to string.
  * @param {integer} d - Eve date as # seconds since epoch.
  * @returns {string} Human readable date string.
  */
function dateToString (d) {
  return new Date(1000 * (epoch + d)).toString().slice(0, 24)
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
  static get Light () { return require('./Light') }
  static get Motion () { return require('./Motion') }
  static get On () { return require('./On') }
  static get Power () { return require('./Power') }
  static get Room () { return require('./Room') }
  static get Thermo () { return require('./Thermo') }
  static get Weather () { return require('./Weather') }

  /** Create a new instance of an Eve _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {integer} [params.memorySize=4032] - The memory size, in number of
    * history entries.  The default is 4 weeks of 1 entry per 10 minutes.
    * @param {?boolean} params.config - Expose config.
    */
  constructor (accessoryDelegate, params = {}) {
    params.name = accessoryDelegate.name + ' History'
    params.Service = accessoryDelegate.Services.eve.History
    params.hidden = true
    super(accessoryDelegate, params)
    const memorySize = params.memorySize == null ? defaultMemorySize : params.memorySize
    this._transfer = false

    this.addCharacteristicDelegate({
      key: 'history',
      silent: true
    })
    if (this.context._history != null) {
      this.values.history = this.context._history
      delete this.context._history
    }
    this._h = this.values.history
    if (this._h == null || this._h.memorySize !== memorySize) {
      this.values.history = {
        memorySize,
        firstEntry: 1,
        lastEntry: 1,
        entries: [null, null],
        currentEntry: 1,
        initialTime: Math.round(new Date().valueOf() / 1000)
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
          this._addEntry()
        }
      })
      .on('shutdown', () => {
        this.debug(
          'saved %d history entries (%d to %d)', this._h.entries.length,
          this._h.firstEntry, this._h.lastEntry
        )
      })
  }

  get now () { return Math.round(new Date().valueOf() / 1000) - this._h.initialTime }

  _addEntry (now = Math.round(new Date().valueOf() / 1000)) {
    this._entry.time = now
    if (this._h.memorySize > 0) {
      if (this._h.lastEntry >= this._h.memorySize) {
        this._h.firstEntry++
      }
      this._h.lastEntry++
      const index = this._h.lastEntry % this._h.memorySize
      this.debug(
        'History Entries: set entry %d (index %d) to %j',
        this._h.lastEntry, index, this._entry
      )
      this._h.entries[index] = Object.assign({}, this._entry)
    }

    this.debug('set History Status to %d .. %d', this._h.firstEntry, this._h.lastEntry)
    const buffer = Buffer.alloc(1024)
    let offset = 0
    buffer.writeUInt32LE(this._entry.time - this._h.initialTime, offset); offset += 4
    buffer.writeUInt32LE(0, offset); offset += 4
    buffer.writeUInt32LE(this._h.initialTime - epoch, offset); offset += 4
    buffer.write(this._fingerPrint.replace(/[^0-9A-F]/ig, ''), offset, 'hex')
    offset += 1 + 2 * parseInt(this._fingerPrint.slice(0, 2))
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
    this._h.currentEntry = Math.max(1, entry)
    this._transfer = true
  }

  async _onGetEntries () {
    if (this._h.currentEntry > this._h.lastEntry || !this._transfer) {
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
        : this._h.currentEntry % this._h.memorySize
      if (this._h.currentEntry === this._h.firstEntry) {
        this.debug(
          'History Entries (%d/11): entry %d (index: %d): %j (%s)',
          i, this._h.currentEntry, index, { initialTime: this._h.initialTime - epoch },
          new Date(1000 * this._h.initialTime).toString().slice(0, 24)
        )
        buffer.writeUInt8(21, offset); offset += 1
        buffer.writeUInt32LE(this._h.currentEntry, offset); offset += 4
        buffer.write('0100000081', offset, 'hex'); offset += 5
        buffer.writeUInt32LE(this._h.initialTime - epoch, offset); offset += 4
        buffer.write('00000000000000', offset, 'hex'); offset += 7
      } else {
        this.debug(
          'History Entries (%d/11): entry %d (index: %d): %j (%s)',
          i, this._h.currentEntry, index, this._h.entries[index],
          new Date(1000 * this._h.entries[index].time).toString().slice(0, 24)
        )
        offset = this._writeEntry(buffer, offset, this._h.entries[index])
      }
      this._h.currentEntry++
      if (this._h.currentEntry > this._h.lastEntry) {
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
