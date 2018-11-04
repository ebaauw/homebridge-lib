// homebridge-lib/lib/LibService.js
//
// Library for homebridge plug-ins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.
//
// See https://github.com/ebaauw/homebridge-lib/wiki/LibService.

'use strict'

const fakegatoHistory = require('./fakegato-history')
const moment = require('moment')

const homebridgeLib = {
  LibCharacteristic: require('./LibCharacteristic'),
  LibObject: require('./LibObject')
}

let HistoryService

// Delegate for Service.
module.exports = class LibService extends homebridgeLib.LibObject {
  constructor (libAccessory, params = {}) {
    if (!(libAccessory instanceof require('./LibAccessory'))) {
      throw new TypeError(`parent: not a LibAccessory`)
    }
    if (params.name == null) {
      throw new SyntaxError(`params.name: missing`)
    }
    super(libAccessory._platform, params.name)
    if (
      typeof params.Service !== 'function' ||
      typeof params.Service.UUID !== 'string'
    ) {
      throw new TypeError(`params.Service: not a Service`)
    }
    this._libAccessory = libAccessory
    const Service = params.Service
    const subtype = params._subtype
    const id = subtype ? [Service.UUID, subtype].join('.') : Service.UUID

    // Get or create associated Service.
    this._service = subtype
      ? libAccessory._accessory.getServiceByUUIDAndSubType(Service, subtype)
      : libAccessory._accessory.getService(Service)
    if (this._service == null) {
      this._service = libAccessory._accessory.addService(
        new Service(this.name, subtype)
      )
    }

    // Setup persisted storage in ~/.homebridge/accessories/cachedAccessories.
    if (libAccessory._accessory.context[id] == null) {
      libAccessory._accessory.context[id] = {}
    }
    this._context = libAccessory._accessory.context[id]

    // Setup shortcut for characteristic values.
    this.values = {}

    // Setup characteristics
    this._libCharacteristics = {}
    for (const characteristic of this._characteristics.concat(this.characteristics)) {
      const key = characteristic.key
      if (characteristic.value == null) {
        characteristic.value = params[key]
      }
      if (!characteristic.isOptional || characteristic.value != null) {
        // Create characteristic delegate.
        const libCharacteristic = new homebridgeLib.LibCharacteristic(
          this, characteristic
        )
        this._libCharacteristics[key] = libCharacteristic
        // Create shortcut for characteristic value.
        Object.defineProperty(this.values, key, {
          writeable: true,
          get () { return libCharacteristic.value },
          set (value) { libCharacteristic.value = value }
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
    if (
      this._libCharacteristics != null && this._libCharacteristics.name != null
    ) {
      this._libCharacteristics.name.value = name
    }
  }

  // ===== Accessory Information ===============================================

  static get AccessoryInformation () {
    return class AccessoryInformation extends LibService {
      constructor (libAccessory, params = {}) {
        params.name = libAccessory.name
        params.Service = libAccessory.Service.hap.AccessoryInformation
        super(libAccessory, params)
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
      constructor (libAccessory, params = {}) {
        params.name = libAccessory.name + ' History'
        params.Service = libAccessory.Service.eve.History
        super(libAccessory, params)
        const homebridge = this._platform._homebridge
        if (HistoryService == null) {
          HistoryService = fakegatoHistory(homebridge)
        }
        const path = homebridge.user.storagePath() + '/accessories'
        const fileName = 'history_' + params.id + '.json'
        this._historyService = new HistoryService(
          params.type, {
            displayName: this.name,
            getService: () => { return this._service },
            debug: (...args) => { this.debug(...args) }
          }, {
            path: path,
            filename: fileName
          }
        )
        this._libAccessory._context.historyFile = path + '/' + fileName
        this._libAccessory.on('heartbeat', this._heartbeat.bind(this))
      }

      // get _characteristics () {
      //   return super._characteristics.concat([
      //     { key: 'request', Characteristic: this.Characteristic.eve.HistoryRequest },
      //     { key: 'setTime', Characteristic: this.Characteristic.eve.SetTime },
      //     { key: 'status', Characteristic: this.Characteristic.eve.HistoryStatus },
      //     { key: 'entries', Characteristic: this.Characteristic.eve.HistoryEntries }
      //   ])
      // }

      _addEntry () {
        this._entry.time = moment().unix()
        this._historyService.addEntry(this._entry)
      }

      _heartbeat (beat) {
        if (beat % 600 === 5) {
          this._addEntry()
        }
      }

      static get Door () {
        return class Door extends LibService.History {
          constructor (libAccessory, params = {}) {
            params.type = 'door'
            super(libAccessory, params)
            this._entry = { status: 0 }
          }
          // get _characteristics () {
          //   return super._characteristics.concat([
          //     { key: 'reset', Characteristic: this.Characteristic.eve.ResetTotal }
          //   ])
          // }
          get status () { return this._entry.status }
          set status (value) {
            this._entry.status = value
            this._addEntry()
          }
        }
      }

      static get Energy () {
        return class Energy extends LibService.History {
          constructor (libAccessory, params = {}) {
            params.type = 'energy'
            super(libAccessory, params)
            this._entry = { power: 0 }
          }
          // get _characteristics () {
          //   return super._characteristics.concat([
          //     { key: 'reset', Characteristic: this.Characteristic.eve.ResetTotal }
          //   ])
          // }
          get power () { return this._entry.power }
          set power (value) {
            this._entry.power = value
          }
        }
      }

      static get Motion () {
        return class Motion extends LibService.History {
          constructor (libAccessory, params = {}) {
            params.type = 'motion'
            super(libAccessory, params)
            this._entry = { status: 0 }
          }
          // get _characteristics () {
          //   return super._characteristics.concat([
          //     { key: 'reset', Characteristic: this.Characteristic.eve.ResetTotal }
          //   ])
          // }
          get status () { return this._entry.status }
          set status (value) {
            this._entry.status = value
            this._addEntry()
          }
        }
      }

      static get Weather () {
        return class Weather extends LibService.History {
          constructor (libAccessory, params = {}) {
            params.type = 'weather'
            super(libAccessory, params)
            this._entry = { temp: 0, humidity: 0, pressure: 0 }
          }
          get temperature () { return this._entry.temp }
          set temperature (value) { this._entry.temp = value }
          get humidity () { return this._entry.humidity }
          set humidity (value) { this._entry.humidity = value }
          get pressure () { return this._entry.pressure }
          set pressure (value) { this._entry.pressure = value }
        }
      }
    }
  }
}
