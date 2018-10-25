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
    if (platform == null) {
      platform = this
    }
    if (!(platform instanceof require('./LibPlatform'))) {
      throw new TypeError(`${platform}: not a LibPlatform`)
    }
    this._platform = platform
    this.name = name
  }

  // ===== Public properties ===================================================

  get Accessory () {
    return this._platform.Accessory
  }

  get Characteristic () {
    return this._platform.Characteristic
  }

  get Service () {
    return this._platform.Service
  }

  get name () {
    return this._name
  }
  set name (name) {
    if (name != null && typeof name !== 'string') {
      throw new TypeError(`${name}: not a string`)
    }
    if (name === '') {
      throw new RangeError(`${name}: invalid name`)
    }
    this._name = name
    this._namePrefix = this._name == null ? '' : name + ': '
  }

  get platform () {
    return this._platform
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
    if (!this._platform._shuttingDown) {
      process.kill(process.pid, 'SIGTERM')
    }
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
