// homebridge-lib/lib/LibObject.js
//
// Library for homebridge plug-ins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.
//
// See https://github.com/ebaauw/homebridge-lib/wiki/LibObject.

'use strict'

const events = require('events')

// Abstract superclass for homebridge-lib objects.
module.exports = class LibObject extends events.EventEmitter {
  // ===== Constructor =========================================================

  constructor (platform, name) {
    super()
    this._name = name
    this._namePrefix = this._name == null ? '' : name + ': '
    this._platform = platform || this

    // Catch any uncaught 'error' events.
    this.on('error', (error) => { this.error(error) })
  }

  // ===== Public properties ===================================================

  get PlatformAccessory () {
    return this._platform._homebridge.platformAccessory
  }

  get Accessory () {
    return this._platform._homebridge.hap.Accessory
  }

  get Characteristic () {
    return this._platform._homebridge.hap.Characteristic
  }

  get HistoryService () {
    return this._platform._HistoryService
  }

  get Service () {
    return this._platform._homebridge.hap.Service
  }

  get eve () {
    return this._platform._eve
  }

  get hap () {
    return this._platform._homebridge.hap
  }

  get homebridge () {
    return this._platform._homebridge
  }

  get my () {
    return this._platform._my
  }

  get name () {
    return this._name
  }
  set name (name) {
    this._name = name
    this._namePrefix = this._name == null ? '' : name + ': '
  }

  get platform () {
    return this._platform
  }

  get storagePath () {
    return this._platform._homebridge.user.storagePath()
  }

  // ===== Public methods ======================================================

  // Print debug message to homebridge output.
  debug (format, ...args) {
    this._platform._message('debug', this._namePrefix, format, ...args)
  }

  // Safe emit.
  emit (eventName, ...args) {
    try {
      super.emit(eventName, ...args)
    } catch (error) {
      this.error(error)
    }
  }

  // Print error message to homebridge output.
  error (format, ...args) {
    this._platform._message('error', this._namePrefix, format, ...args)
  }

  // Print error message to homebridge output and exit.
  fatal (format, ...args) {
    this._platform._message('fatal', this._namePrefix, format, ...args)
    process.kill(process.pid, 'SIGTERM')
  }

  // Print log message to homebridge output.
  log (format, ...args) {
    this._platform._message('log', this._namePrefix, format, ...args)
  }

  // Print warning message to homebridge output.
  warn (format, ...args) {
    this._platform._message('warning', this._namePrefix, format, ...args)
  }
}
