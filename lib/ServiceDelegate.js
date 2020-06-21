// homebridge-lib/lib/ServiceDelegate.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2020 Erik Baauw. All rights reserved.
//
// The logic for handling Eve history was copied from Simone Tisa's
// fakagato-history repository, copyright © 2017 simont77.
// See https://github.com/simont77/fakegato-history.

'use strict'

const homebridgeLib = require('../index')

const util = require('util')

/** Abstract superclass for a HomeKit service delegate.
  *
  * This delegate sets up a HomeKit service with the following HomeKit
  * characteristic:
  *
  * key            | Characteristic
  * -------------- | -------------------------
  * `name`         | `Characteristics.hap.Name`
  * @abstract
  * @extends Delegate
  */
class ServiceDelegate extends homebridgeLib.Delegate {
  /** Create a new instance of a HomeKit service delegate.
    *
    * When the associated HomeKit service was restored from persistent
    * storage, it is linked to the new delegate. Otherwise a new HomeKit
    * service will be created, using the values from `params`.
    * @param {!AccessoryDelegate} accessoryDelegate - Reference to the
    * associated HomeKit accessory delegate.
    * @param {!object} params - Properties of the HomeKit service.<br>
    * Next to the fixed properties below, `params` also contains the value for
    * each key specified in {@link ServiceDelegate#characteristics characteristics}.
    * @param {!string} params.name - The (Siri) name of the service.
    * Also used to prefix log and error messages.
    * @param {!Service} params.Service - The type of the HomeKit service.
    * @param {?string} params.subtype - The subtype of the HomeKit service.
    * Needs to be specified when the accessory has multuple services of the
    * same type.
    * @params {?boolean} params.primaryService - This is the primary service
    * for the accessory.
    * @params {?ServiceDelegate} params.linkedServiceDelegate - The delegate
    * of the service this service links to.
    */
  constructor (accessoryDelegate, params = {}) {
    if (!(accessoryDelegate instanceof homebridgeLib.AccessoryDelegate)) {
      throw new TypeError('parent: not a AccessoryDelegate')
    }
    if (params.name == null) {
      throw new SyntaxError('params.name: missing')
    }
    super(accessoryDelegate.platform, params.name)
    if (
      typeof params.Service !== 'function' ||
      typeof params.Service.UUID !== 'string'
    ) {
      throw new TypeError('params.Service: not a Service')
    }
    this._accessoryDelegate = accessoryDelegate
    this._accessory = this._accessoryDelegate._accessory
    this._key = params.Service.UUID
    if (params.subtype != null) {
      this._key += '.' + params.subtype
    }

    // Get or create associated Service.
    this._service = params.subtype == null
      ? this._accessory.getService(params.Service)
      : this._accessory.getServiceByUUIDAndSubType(params.Service, params.subtype)
    if (this._service == null) {
      this._service = this._accessory.addService(
        new params.Service(this.name, params.subtype)
      )
    }
    this._accessoryDelegate._linkServiceDelegate(this)
    if (params.primaryService) {
      this._accessoryDelegate._primaryService = this._service
    }
    if (params.linkedServiceDelegate != null) {
      params.linkedServiceDelegate._service.addLinkedService(this._service)
    }

    // Fix bug in homebridge-lib@<4.3.0 that caused the service context in
    // ~/.homebridge/accessories/cachedAccessories to be stored under the
    // wrong key.
    if (
      params.subtype == null &&
      this._accessory.context[this._key + '.'] != null
    ) {
      this._accessory.context[this._key] =
        this._accessory.context[this._key + '.']
      delete this._accessory.context[this._key + '.']
    }

    // Setup persisted storage in ~/.homebridge/accessories/cachedAccessories.
    if (this._accessory.context[this._key] == null) {
      this._accessory.context[this._key] = {}
    }
    this._context = this._accessory.context[this._key]

    // Setup shortcut for characteristic values.
    this._values = {} // by key

    // Setup characteristics
    this._characteristicDelegates = {} // by key
    this._characteristics = {} // by iid
    this.addCharacteristicDelegate({
      key: 'name',
      Characteristic: this.Characteristics.hap.Name,
      silent: true,
      value: params.name
    })

    // Setup name
    this.name = params.name

    this.once('initialised', () => {
      const staleCharacteristics = []
      for (const iid in this._service.characteristics) {
        const characteristic = this._service.characteristics[iid]
        if (this._characteristics[characteristic.UUID] == null) {
          staleCharacteristics.push(characteristic)
        }
      }
      for (const characteristic of staleCharacteristics) {
        this.log('remove stale characteristic %s', characteristic.displayName)
        this._service.removeCharacteristic(characteristic)
      }
      const staleKeys = []
      for (const key in this._context) {
        if (key !== 'context' && this._characteristicDelegates[key] == null) {
          staleKeys.push(key)
        }
      }
      for (const key of staleKeys) {
        this.log('remove stale value %s', key)
        delete this._context[key]
      }
    })
  }

  /** Destroy the HomeKit service delegate.
    *
    * Destroys the associated HomeKit characteristic delegates.
    * Removes the associated HomeKit service.
    */
  destroy () {
    this.debug('destroy %s (%s)', this._key, this._service.displayName)
    this._accessoryDelegate._unlinkServiceDelegate(this)
    this.removeAllListeners()
    for (const key in this._characteristicDelegates) {
      this._characteristicDelegates[key].destroy()
    }
    this._accessory.removeService(this._service)
    delete this._accessory.context[this._key]
  }

  /** Add a HomeKit characteristic delegate to the HomeKit service delegate.
    *
    * The characteristic delegate manages a value that:
    * - Is persisted across homebridge restarts;
    * - Can be monitored through homebridge's log output;
    * - Can be monitored programmatially through `didSet` events; and
    * - Mirrors the value of the optionally associated HomeKit characteristic.
    *
    * This value is accessed through {@link ServiceDelegate#values values}.
    * The delegate is returned, but can also be accessed through
    * {@link ServiceDelegate#characteristicDelegate characteristicDelegate()}.
    *
    * When the associated HomeKit characteristic was restored from persistent
    * storage, it is linked to the new delegate. Otherwise a new HomeKit
    * charactertistic will be created, using the values from `params`.
    * @param {!object} params - Properties of the HomeKit characteristic.
    * @param {!string} params.key - The key for the characteristic.
    * @param {?*} params.value - The initial value when the characteristic
    * is added.
    * @param {?boolean} params.silent - Suppress set log messages.
    * @param {?Characteristic} params.Characteristic - The type of the
    * characteristic, from {@link Delegate#Characteristic Characteristic}.
    * @param {?object} params.props - The properties of the HomeKit
    * characteristic.<br>
    * Overrides the properties from the characteristic type.
    * @param {?string} params.unit - The unit of the value of the HomeKit
    * characteristic.<br>
    * Overrides the unit from the characteristic type.
    * @param {?function} params.getter - Asynchronous function to be invoked
    * when HomeKit reads the characteristic value.<br>
    * This must be an `async` function returning a `Promise` to the new
    * characteristic value.
    * @param {?function} params.setter - Asynchronous function to be invoked
    * when HomeKit writes the characteristic value.<br>
    * This must be an `async` function returning a `Promise` that resolves
    * when the corresonding device value has been updated.
    * @returns {CharacteristicDelegate}
    * @throws `TypeError` - When value is `undefined` or `null`.
    * @throws `RangeError` - When value is `undefined` or `null`.
    * @throws `SyntaxError` - When value is `undefined` or `null`.
    */
  addCharacteristicDelegate (params = {}) {
    if (typeof params.key !== 'string') {
      throw new RangeError(`params.key: ${params.key}: invalid key`)
    }
    if (params.key === '') {
      throw new RangeError(`params.key: ${params.key}: invalid key`)
    }
    const key = params.key
    if (this.values[key] !== undefined) {
      throw new SyntaxError(`${key}: duplicate key`)
    }

    const characteristicDelegate = new homebridgeLib.CharacteristicDelegate(
      this, params
    )
    this._characteristicDelegates[key] = characteristicDelegate
    if (params.Characteristic != null) {
      this._characteristics[params.Characteristic.UUID] = true
    }

    // Create shortcut for characteristic value.
    Object.defineProperty(this.values, key, {
      configurable: true, // make sure we can delete it again
      writeable: true,
      get () { return characteristicDelegate.value },
      set (value) { characteristicDelegate.value = value }
    })

    return characteristicDelegate
  }

  removeCharacteristicDelegate (key) {
    delete this.values[key]
    const characteristicDelegate = this._characteristicDelegates[key]
    if (characteristicDelegate._characteristic != null) {
      const characteristic = characteristicDelegate._characteristic
      delete this._characteristics[characteristic.UUID]
    }
    characteristicDelegate._destroy()
    delete this._characteristicDelegates[key]
    delete this._context[key]
  }

  /** Name of the accociated HomeKit service.
    * @type {string}
    */
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

  /** Values of the HomeKit characteristics for the HomeKit service.
    *
    * Contains the key of each characteristic added by
    * {@link ServiceDelegate#addCharacteristic addCharacteristic}.
    * When the value is written, the value of the corresponding HomeKit
    * characteristic is updated; when the characteristic value is changed from
    * HomeKit, this value is updated.
    * @type {object}
    */
  get values () {
    return this._values
  }

  /** Returns the HomeKit characteristic delegate correspondig to the key.
    * @param {!string} key - The key for the characteristic.
    * returns {CharacteristicDelegate}
    */
  characteristicDelegate (key) {
    return this._characteristicDelegates[key]
  }

  /** The corrresponding HomeKit accessory delegate.
    * @type {AccessoryDelegate}
    */
  get accessoryDelegate () {
    return this._accessoryDelegate
  }

  /** Service context to be persisted across Homebridge restarts.
    * @type {object}
    */
  get context () {
    if (this._context.context == null) {
      this._context.context = {}
    }
    return this._context.context
  }

  /** Current log level (of the associated accessory delegate).
    *
    * The log level determines what type of messages are printed:
    *
    * 0. Print error and warning messages.
    * 1. Print error, warning, and log messages.
    * 2. Print error, warning, log, and debug messages.
    * 3. Print error, warning, log, debug, and verbose debug messages.
    *
    * Note that debug messages (level 2 and 3) are only printed when
    * Homebridge was started with the `-D` or `--debug` command line option.
    *
    * @type {!int}
    * @readonly
    */
  get logLevel () {
    return this._accessoryDelegate.logLevel
  }

  static get AccessoryInformation () { return AccessoryInformation }

  static get ServiceLabel () { return ServiceLabel }

  static get History () { return History }
}

/** Class for an _AccessoryInformation_ service delegate.
  *
  * This delegate sets up a `Services.hap.AccessoryInformation` HomeKit service
  * with the following HomeKit characteristics:
  *
  * key            | Characteristic                         | isOptional
  * -------------- | -------------------------------------- | ----------
  * `name`         | `Characteristics.hap.Name`             |
  * `id`           | `Characteristics.hap.SerialNumber`     |
  * `manufacturer` | `Characteristics.hap.Manufacturer`     |
  * `model`        | `Characteristics.hap.Model`            |
  * `firmware`     | `Characteristics.hap.FirmwareRevision` |
  * `hardware`     | `Characteristics.hap.HardwareRevision` | Y
  * `software`     | `Characteristics.hap.SoftwareRevision` | Y
  * @extends ServiceDelegate
  * @memberof ServiceDelegate
  */
class AccessoryInformation extends ServiceDelegate {
  /** Create a new instance of an _AccessoryInformation_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _AccessoryInformation_ HomeKit service.
    * @param {!string} params.name - Initial value for
    * `Characteristics.hap.Name`. Also used to prefix log and error messages.
    * @param {!string} params.id - Initial value for
    * `Characteristics.hap.SerialNumber`.
    * @param {!string} params.manufacturer - Initial value for
    * `Characteristics.hap.Manufacturer`.
    * @param {!string} params.model - Initial value for
    * `Characteristics.hap.Model`.
    * @param {!string} params.firmware - Initial value for
    * `Characteristics.hap.FirmwareRevision`.
    * @param {?string} params.hardware - Initial value for
    * `Characteristics.hap.HardwareRevision`.
    * @param {?string} params.software - Initial value for
    * `Characteristics.hap.SoftwareRevision`.
    */
  constructor (accessoryDelegate, params = {}) {
    params.name = accessoryDelegate.name
    params.Service = accessoryDelegate.Services.hap.AccessoryInformation
    super(accessoryDelegate, params)
    this.addCharacteristicDelegate({
      key: 'id',
      Characteristic: this.Characteristics.hap.SerialNumber,
      value: params.id
    })
    this.addCharacteristicDelegate({
      key: 'identify',
      Characteristic: this.Characteristics.hap.Identify
    })
    this.addCharacteristicDelegate({
      key: 'manufacturer',
      Characteristic: this.Characteristics.hap.Manufacturer,
      value: params.manufacturer
    })
    this.addCharacteristicDelegate({
      key: 'model',
      Characteristic: this.Characteristics.hap.Model,
      value: params.model
    })
    this.addCharacteristicDelegate({
      key: 'firmware',
      Characteristic: this.Characteristics.hap.FirmwareRevision,
      value: params.firmware
    })
    if (params.hardware != null) {
      this.addCharacteristicDelegate({
        key: 'hardware',
        Characteristic: this.Characteristics.hap.HardwareRevision,
        value: params.hardware
      })
    }
    if (params.software != null) {
      this.addCharacteristicDelegate({
        key: 'software',
        Characteristic: this.Characteristics.hap.SoftwareRevision,
        value: params.software
      })
    }
  }
}

/** Class for a _ServiceLabel_ service delegate.
  *
  * This delegate sets up a `Services.hap.ServiceLabel` HomeKit service
  * with the following HomeKit characteristics:
  *
  * key            | Characteristic                              | isOptional
  * -------------- | ------------------------------------------- | ----------
  * `name`         | `Characteristics.hap.Name`                  |
  * `namespace`    | `Characteristics.hap.ServiceLabelNamespace` |
  * @extends ServiceDelegate
  * @memberof ServiceDelegate
  */
class ServiceLabel extends ServiceDelegate {
  /** Create a new instance of an _ServiceLabel_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _AccessoryInformation_ HomeKit service.
    * @param {!string} params.name - Initial value for
    * `Characteristics.hap.Name`. Also used to prefix log and error messages.
    * @param {!string} params.namespace - Initial value for
    * `Characteristics.hap.ServiceLabelNamespace`.
    */
  constructor (accessoryDelegate, params = {}) {
    params.name = accessoryDelegate.name
    params.Service = accessoryDelegate.Services.hap.ServiceLabel
    super(accessoryDelegate, params)
    this.addCharacteristicDelegate({
      key: 'namespace',
      Characteristic: this.Characteristics.hap.ServiceLabelNamespace,
      value: params.namespace
    })
  }
}

const epoch = Math.round(new Date('2001-01-01T00:00:00Z').valueOf() / 1000)

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
  /** Create a new instance of an Eve _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    */
  constructor (accessoryDelegate, params = {}) {
    params.name = accessoryDelegate.name + ' History'
    params.Service = accessoryDelegate.Services.eve.History
    super(accessoryDelegate, params)
    this._memorySize = 4032
    this._transfer = false
    this._setTime = true
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
        refTime: 0
      }
      this._h = this.values.history
    } else {
      this.debug('restored %d history entries', this._h.usedMemory)
    }

    this.addCharacteristicDelegate({
      key: 'historyRequest',
      Characteristic: this.Characteristics.eve.HistoryRequest,
      value: params.historyRequest,
      setter: this._onSetHistoryRequest.bind(this)
    })
    this.addCharacteristicDelegate({
      key: 'setTime',
      Characteristic: this.Characteristics.eve.SetTime,
      value: params.setTime
    })
    this.addCharacteristicDelegate({
      key: 'historyStatus',
      Characteristic: this.Characteristics.eve.HistoryStatus,
      value: params.historyStatus
    })
    this.addCharacteristicDelegate({
      key: 'historyEntries',
      Characteristic: this.Characteristics.eve.HistoryEntries,
      value: params.historyEntries,
      getter: this._onGetEntries.bind(this)
    })
    this._accessoryDelegate.heartbeatEnabled = true
    this._accessoryDelegate.once('heartbeat', (beat) => {
      this._historyBeat = (beat % 600) + 5
    })
    this._accessoryDelegate.on('heartbeat', this._heartbeat.bind(this))
    this._accessoryDelegate.on('shutdown', () => {
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

    if (this._h.refTime === 0) {
      this._h.refTime = this._entry.time - epoch
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
    const value = util.format(
      '%s 00000000 %s [%s] %s %s %s 000000000101',
      numToHex(swap32(this._entry.time - this._h.refTime - epoch), 8),
      numToHex(swap32(this._h.refTime), 8),
      this._fingerPrint,
      numToHex(swap16(this._h.usedMemory + usedMemeoryOffset), 4),
      numToHex(swap16(this._memorySize), 4),
      numToHex(swap32(this._h.firstEntry + firstEntryOffset), 8))

    this.debug('add entry %d: %j', this._h.lastEntry, this._entry)
    this.debug('set history status to: %s', value)
    this.values.historyStatus = hexToBase64(value)
  }

  _heartbeat (beat) {
    if (beat % 600 === this._historyBeat) {
      this._addEntry()
    }
  }

  async _onSetHistoryRequest (value) {
    const entry = swap32(parseInt(base64ToHex(value).substring(4, 12), 16))
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
        this._setTime === true ||
        this._h.currentEntry === this._h.firstEntry + 1
      ) {
        this.debug(
          'entry: %s, address %s, reftime: %s (%s)', this._h.currentEntry,
          address, this._h.refTime,
          new Date(1000 * (this._h.refTime + epoch)).toString().slice(0, 24)
        )
        dataStream += util.format(
          '|15 %s 0100000081 %s 00000000000000',
          numToHex(swap32(this._h.currentEntry), 8),
          numToHex(swap32(this._h.refTime), 8))
        this._setTime = false
      } else {
        this.debug(
          'entry: %s, address: %s, time: %s (%s)', this._h.currentEntry,
          address, this._h.history[address].time - this._h.refTime - epoch,
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

  static get Consumption () { return Consumption }

  static get Contact () { return Contact }

  static get Motion () { return Motion }

  static get On () { return On }

  static get Power () { return Power }

  static get Thermo () { return Thermo }

  static get Weather () { return Weather }
}

/** Class for an Eve Energy _History_ service delegate.
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
  *
  * This delegate is for sensors that report life-time consumption. The history
  * is computed from the changes to the value of the associated
  * `Characteristics.eve.TotalConsumption` characteristic. If the sensor doesn't
  * also report power, this delegate can update the the value of the associated
  * `Characteristics.eve.CurrentConsumption` characteristic.
  *
  * Note that the key in the history entry is called `power`, but its value
  * is the consumption in Wh since the previous entry.
  *
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Consumption extends ServiceDelegate.History {
  /** Create a new instance of an Eve Energy _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} consumptionDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.TotalConsumption`
    * characteristic.
    * @param {?CharacteristicDelegate} powerDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.CurrentConsumption`
    * characteristic.
    */
  constructor (
    accessoryDelegate, params = {},
    consumptionDelegate, powerDelegate
  ) {
    super(accessoryDelegate, params)
    if (!(consumptionDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('consumptionDelegate: not a CharacteristicDelegate')
    }
    if (
      powerDelegate != null &&
      !(powerDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('powerDelegate: not a CharacteristicDelegate')
    }
    this.addCharacteristicDelegate({
      key: 'consumption',
      silent: true
    })
    this._consumptionDelegate = consumptionDelegate
    this._powerDelegate = powerDelegate
    this._entry = { time: 0, power: 0 }
  }

  _addEntry () {
    // Sensor deliveres totalConsumption, optionally compute currentConsumption
    if (this.values.consumption != null) {
      const delta = this._consumptionDelegate.value - this.values.consumption // kWh
      if (this._powerDelegate != null) {
        // So we consumed `delta` kWh / 10 min.
        // That's `delta` kWh / (1/6)h, or `delta` * 6 kW or `delta` * 6000 W.
        this._powerDelegate.value = Math.round(delta * 6000) // W
      }
      this._entry.power = Math.round(delta * 1000) // Wh
      super._addEntry()
    }
    this.values.consumption = this._consumptionDelegate.value
  }

  // get _fingerPrint () { return '04 0102 0202 0702 0f03' }
  get _fingerPrint () { return '01 0702' }

  _entryStream (entry) {
    return util.format(
      // '|14 %s %s 1f 0000 0000 %s 0000 0000',
      '|0c %s %s 01 %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.refTime - epoch), 8),
      numToHex(swap16(entry.power * 10), 4)
    )
  }
}

/** Class for an Eve Door _History_ service delegate.
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
  * `Characteristics.hap.ContactSensorState` characteristic.  It updates the
  * values of the associated `Characteristics.eve.TimesOpened` and
  * `Characteristics.eve.LastActivation` characteristics.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Contact extends ServiceDelegate.History {
  /** Create a new instance of an Eve Door _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} contactDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.ContactSensorState`
    * characteristic.
    * @param {!CharacteristicDelegate} timesOpenedDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.TimesOpened`
    * characteristic.
    * @param {!CharacteristicDelegate} lastActivationDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.LastActivation`
    * characteristic.
    */
  constructor (
    accessoryDelegate, params = {},
    contactDelegate, timesOpenedDelegate, lastActivationDelegate
  ) {
    super(accessoryDelegate, params)
    if (!(contactDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('contactDelegate: not a CharacteristicDelegate')
    }
    if (!(timesOpenedDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('timesOpenedDelegate: not a CharacteristicDelegate')
    }
    if (!(lastActivationDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('lastActivationDelegate: not a CharacteristicDelegate')
    }
    this._entry = { time: 0, status: contactDelegate.value }
    contactDelegate.on('didSet', (value) => {
      const now = Math.round(new Date().valueOf() / 1000)
      timesOpenedDelegate.value += value
      lastActivationDelegate.value = now - this._h.initialTime
      this._entry.status = value
      this._addEntry(now)
    })
    this.addCharacteristicDelegate({
      key: 'resetTotal',
      Characteristic: this.Characteristics.eve.ResetTotal,
      value: params.resetTotal
    })
    this._characteristicDelegates.resetTotal.on('didSet', (value) => {
      timesOpenedDelegate.value = 0
    })
  }

  get _fingerPrint () { return '01 0601' }

  _entryStream (entry) {
    return util.format(
      '|0b %s %s 01 %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.refTime - epoch), 8),
      numToHex(entry.status, 2)
    )
  }
}

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
    * @param {!CharacteristicDelegate} motionDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.MotionDetected`
    * characteristic.
    * @param {!CharacteristicDelegate} lastActivationDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.LastActivation`
    * characteristic.
    * @param {?CharacteristicDelegate} temperatureDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.CurrentTemperature`
    * characteristic.  For PIR sensors (like the Hue motion sensor) that report
    * temperature in addition to motion.
    */
  constructor (
    accessoryDelegate, params = {},
    motionDelegate, lastActivationDelegate, temperatureDelegate
  ) {
    super(accessoryDelegate, params)
    if (!(motionDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('motionDelegate: not a CharacteristicDelegate')
    }
    if (!(lastActivationDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('lastActivationDelegate: not a CharacteristicDelegate')
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
        const temp = this._entry.temp
        this._entry.temp = null
        this._addEntry(now)
        this._entry.temp = temp
      } else {
        this._addEntry(now)
      }
    })
    if (temperatureDelegate != null) {
      this._entry.temp = temperatureDelegate.value
      temperatureDelegate.on('didSet', (value) => {
        this._entry.temp = value
      })
    }
  }

  get _fingerPrint () {
    if (this._entry.temp != null) {
      return '02 1c01 0102'
    }
    return '01 1c01'
  }

  _entryStream (entry) {
    if (this._entry.temp != null) {
      return util.format(
        '|0d %s %s 03 %s %s',
        numToHex(swap32(this._h.currentEntry), 8),
        numToHex(swap32(entry.time - this._h.refTime - epoch), 8),
        numToHex(entry.status, 2),
        numToHex(swap16(entry.temp * 100), 4)
      )
    }
    return util.format(
      '|0b %s %s 01 %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.refTime - epoch), 8),
      numToHex(entry.status, 2)
    )
  }
}

/** Class for an Eve Energy _History_ service delegate.
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
  * This delegate is for sensors that don't report life-time consumption. The
  * history from the value of the associated
  * `Characteristics.eve.CurrentConsumption` over time. It updates the value of
  * the associated `Characteristics.eve.TotalConsumption` characteristic.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Power extends ServiceDelegate.History {
  /** Create a new instance of an Eve Energy _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} powerDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.CurrentConsumption`
    * characteristic.
    * @param {!CharacteristicDelegate} consumptionDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.TotalConsumption`
    * characteristic.
    */
  constructor (
    accessoryDelegate, params = {},
    powerDelegate, consumptionDelegate
  ) {
    super(accessoryDelegate, params)
    if (!(powerDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('powerDelegate: not a CharacteristicDelegate')
    }
    if (!(consumptionDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('consumptionDelegate: not a CharacteristicDelegate')
    }
    this._powerDelegate = powerDelegate
    this._consumptionDelegate = consumptionDelegate
    this._entry = { time: 0, power: 0 }
    this._runningConsumption = 0 // 10-min-interval running value
    this._totalConsumption = consumptionDelegate.value // life-time value
    powerDelegate.on('didSet', (value) => {
      const now = Math.round(new Date().valueOf() / 1000)
      if (this._time != null) {
        const delta = this._power * (now - this._time) // Ws
        this._runningConsumption += Math.round(delta / 600.0) // W * 10 min
        this._totalConsumption += Math.round(delta / 3600.0) // Wh
      }
      this._power = value
      this._time = now
    })
    this.addCharacteristicDelegate({
      key: 'resetTotal',
      Characteristic: this.Characteristics.eve.ResetTotal,
      value: params.resetTotal
    })
    this._characteristicDelegates.resetTotal.on('didSet', (value) => {
      this._runningConsumption = 0
      this._totalConsumption = 0
      this._consumptionDelegate.value = this._totalConsumption
    })
  }

  _addEntry () {
    // Sensor delivers currentConsumption, compute totalConsumption
    const now = Math.round(new Date().valueOf() / 1000)
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

  // get _fingerPrint () { return '04 0102 0202 0702 0f03' }
  get _fingerPrint () { return '01 0702' }

  _entryStream (entry) {
    return util.format(
      // '|14 %s %s 1f 0000 0000 %s 0000 0000',
      '|0c %s %s 01 %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.refTime - epoch), 8),
      numToHex(swap16(entry.power * 10), 4)
    )
  }
}

/** Class for an Eve Thermo _History_ service delegate.
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
  *
  * This delegate creates the history from the associated
  * `Characteristics.hap.CurrentTemperature`,
  * `Characteristics.hap.TargetTemperature`, and
  * `Characteristics.eve.ValvePosition` characteristics.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Thermo extends ServiceDelegate.History {
  /** Create a new instance of an Eve Thermo _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} temperatureDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.CurrentTemperature`
    * characteristic.
    * @param {!CharacteristicDelegate} targetTemperatureDelegate - A reference
    * to the delegate of the associated `Characteristics.hap.TargetTemperature`
    * characteristic.
    * @param {!CharacteristicDelegate} valvePositionDelegate - A reference to
    * the delegate of the associated `Characteristics.eve.ValvePosition`
    * characteristic.
    */
  constructor (
    accessoryDelegate, params = {},
    temperatureDelegate, targetTemperatureDelegate, valvePositionDelegate
  ) {
    super(accessoryDelegate, params)
    if (!(temperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('temperatureDelegate: not a CharacteristicDelegate')
    }
    if (!(targetTemperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('targetTemperatureDelegate: not a CharacteristicDelegate')
    }
    if (!(valvePositionDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('valvePositionDelegate: not a CharacteristicDelegate')
    }
    this._entry = {
      time: 0,
      currentTemp: temperatureDelegate.value,
      setTemp: targetTemperatureDelegate.value,
      valvePosition: valvePositionDelegate.value
    }
    temperatureDelegate
      .on('didSet', (value) => { this._entry.currentTemp = value })
    targetTemperatureDelegate
      .on('didSet', (value) => { this._entry.setTemp = value })
    valvePositionDelegate
      .on('didSet', (value) => { this._entry.valvePosition = value })
  }

  // I think 1201 and 1d01 are for current mode and target more, but it doesn't
  // look like Eve displays any history for these.
  // As of v3.8.1, Eve no longer shows the valve position history.
  // get _fingerPrint () { return '05 0102 1102 1001 1201 1d01' }
  get _fingerPrint () { return '03 0102 1102 1001' }

  _entryStream (entry) {
    return util.format(
      // '|11 %s %s 1f %s %s %s 00 00',
      '|0f %s %s 07 %s %s %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.refTime - epoch), 8),
      numToHex(swap16(entry.currentTemp * 100), 4),
      numToHex(swap16(entry.setTemp * 100), 4),
      numToHex(entry.valvePosition, 2)
    )
  }
}

/** Class for an Eve Weather _History_ service delegate.
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
  *
  * This delegate creates the history from the associated
  * `Characteristics.eve.CurrentTemperature`,
  * `Characteristics.hap.CurrentRelativeHumidity`, and
  * `Characteristics.eve.AirPressure` characteristics.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class Weather extends ServiceDelegate.History {
  /** Create a new instance of an Eve Weather _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} temperatureDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.CurrentTemperature`
    * characteristic.
    * @param {?CharacteristicDelegate} humidityDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.CurrentRelativeHumidity`
    * characteristic.
    * @param {?CharacteristicDelegate} pressureDelegate - A reference to the
    * delegate of the associated `Characteristics.eve.AirPressure`
    * characteristic.
    */
  constructor (
    accessoryDelegate, params = {},
    temperatureDelegate, humidityDelegate, pressureDelegate
  ) {
    super(accessoryDelegate, params)
    if (!(temperatureDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('temperatureDelegate: not a CharacteristicDelegate')
    }
    if (
      humidityDelegate != null &&
      !(humidityDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('humidityDelegate: not a CharacteristicDelegate')
    }
    if (
      pressureDelegate != null &&
      !(pressureDelegate instanceof homebridgeLib.CharacteristicDelegate)
    ) {
      throw new TypeError('pressureDelegate: not a CharacteristicDelegate')
    }
    this._entry = {
      time: 0,
      temp: temperatureDelegate.value,
      humidity: 0,
      pressure: 0
    }
    temperatureDelegate.on('didSet', (value) => {
      this._entry.temp = value
    })
    if (humidityDelegate != null) {
      this._entry.humidity = humidityDelegate.value
      humidityDelegate.on('didSet', (value) => {
        this._entry.humidity = value
      })
      if (pressureDelegate != null) {
        this._entry.pressure = pressureDelegate.value
        pressureDelegate.on('didSet', (value) => {
          this._entry.pressure = value
        })
      }
    }
  }

  get _fingerPrint () {
    return '03 0102 0202 0302'
  }

  _entryStream (entry) {
    return util.format(
      '|10 %s %s 07 %s %s %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.refTime - epoch), 8),
      numToHex(swap16(entry.temp * 100), 4),
      numToHex(swap16(entry.humidity * 100), 4),
      numToHex(swap16(entry.pressure * 10), 4)
    )
  }
}

/** Class for a Raspberry Pi _History_ service delegate.
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
  *
  * This delegate creates the history from the associated
  * `Characteristics.hap.On` characteristic.
  * @extends ServiceDelegate.History
  * @memberof ServiceDelegate.History
  */
class On extends ServiceDelegate.History {
  /** Create a new instance of a Raspberry Pi _History_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _History_ HomeKit service.
    * @param {!CharacteristicDelegate} onDelegate - A reference to the
    * delegate of the associated `Characteristics.hap.On`
    * characteristic.
    */
  constructor (accessoryDelegate, params = {}, onDelegate) {
    super(accessoryDelegate, params)
    if (!(onDelegate instanceof homebridgeLib.CharacteristicDelegate)) {
      throw new TypeError('onDelegate: not a CharacteristicDelegate')
    }
    this._entry = {
      time: 0,
      on: onDelegate.value ? 1 : 0
    }
    onDelegate.on('didSet', (value) => {
      this._entry.on = value ? 1 : 0
      this._addEntry()
    })
  }

  get _fingerPrint () { return '01 0e01' }

  _entryStream (entry) {
    return util.format(
      '|0b %s %s 01 %s',
      numToHex(swap32(this._h.currentEntry), 8),
      numToHex(swap32(entry.time - this._h.refTime - epoch), 8),
      numToHex(entry.on, 2)
    )
  }
}

module.exports = ServiceDelegate
