// homebridge-lib/lib/LibService.js
//
// Library for homebridge plug-ins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.
//
// See https://github.com/ebaauw/homebridge-lib/wiki/LibService.

'use strict'

const fakegatoHistory = require('fakegato-history')
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
        this.historyService = new HistoryService(
          params.type, { displayName: this.name }, {
            disableTimer: true,
            storage: 'fs',
            path: path,
            filename: fileName
          }
        )
        this._libAccessory._context.historyFile = path + '/' + fileName
        this._libAccessory.on('heartbeat', this.heartbeat.bind(this))
      }

      addEntry () {
        this.entry.time = moment().unix()
        this.debug('add entry %j', this.entry)
        this.historyService.addEntry(this.entry)
      }

      heartbeat (beat) {
        if (beat % 600 === 5) {
          this.addEntry()
        }
      }

      static get Weather () {
        return class Weather extends LibService.History {
          constructor (libAccessory, params = {}) {
            params.type = 'weather'
            super(libAccessory, params)
            this.entry = { temp: 0, humidity: 0, pressure: 0 }
          }
          get temperature () { return this.entry.temp }
          set temperature (value) { this.entry.temp = value }
          get humidity () { return this.entry.humidity }
          set humidity (value) { this.entry.humidity = value }
          get pressure () { return this.entry.pressure }
          set pressure (value) { this.entry.pressure = value }
        }
      }
    }
  }
}
