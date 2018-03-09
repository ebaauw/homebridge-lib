// homebridge-lib/lib/LibObject.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.
//
// See https://github.com/ebaauw/homebridge-lib/wiki/LibObject.

'use strict'

const EventEmitter = require('events')
const util = require('util')

// Abstract superclass for homebridge-lib objects.
module.exports = class LibObject extends EventEmitter {
  // ===== Constructor =========================================================

  constructor (platform, name) {
    super()
    this._name = name
    this._platform = platform || this

    // Catch any uncaught 'error' events.
    this.on('error', (error) => { this.error(error) })
  }

  // ===== Public properties ===================================================

  get Accessory () {
    return this._platform._homebridge.platformAccessory
  }

  get Characteristic () {
    return this._platform._homebridge.hap.Characteristic
  }

  get Service () {
    return this._platform._homebridge.hap.Service
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
    if (this._options.debug) {
      this._log('debug', format, ...args)
    }
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
    this._log('error', format, ...args)
  }

  // Print error message to homebridge output and exit.
  fatal (format, ...args) {
    this._log('error', format, ...args)
    process.exit(1)
  }

  // Print log message to homebridge output.
  log (format, ...args) {
    this._log('log', format, ...args)
  }

  // Print warning message to homebridge output.
  warn (format, ...args) {
    this._log('warning', format, ...args)
  }

  // ===== Private methods =====================================================

  // Do the heavy lifting for debug(), error(), fatal(), log(), and warn(),
  // taking into account errors vs exceptions.
  _log (level, format, ...args) {
    let message

    if (format == null) {
      message = ''
    } else if (format instanceof Error) {
      switch (format.constructor.name) {
        case 'AssertionError':
        case 'RangeError':
        case 'ReferenceError':
        case 'SyntaxError':
        case 'TypeError':
          // Error: print stack trace.
          message = format.stack
          break
        default:
          // Exception: print message only.
          message = format.message
          break
      }
    } else if (typeof (format) === 'string') {
      message = util.format(format, ...args)
    } else if (typeof (format.toString) === 'function') {
      // Not a string, but convertable into a string.
      message = util.format(format.toString(), ...args)
    } else {
      throw new TypeError('format: not a string or Error object')
    }
    switch (level) {
      case 'debug':
        message = this._namePrefix + message
        this._platform._log.debug(message)
        break
      case 'log':
        message = this._namePrefix + message
        this._platform._log(message)
        break
      case 'warning':
        message = this._namePrefix + 'warning: ' + message
        this._platform._log.warn(message)
        break
      case 'error':
        message = this._namePrefix + 'error: ' + message
        this._platform._log.error(message)
        break
    }
  }
}
