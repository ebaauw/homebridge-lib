// homebridge-lib/lib/OptionParser.js
//
// Library for homebridge plug-ins.
// Copyright © 2018 Erik Baauw. All rights reserved.
//
// Parser for options object (and other parameters).

'use strict'

const debug = require('debug')
const events = require('events')

class UsageError extends Error {}

let id = 0

// Create a new RangeError or UsageError, depending on userInput.
function newRangeError (message, userInput = false) {
  return userInput ? new UsageError(message) : new RangeError(message)
}

// Create a new SyntaxError or UsageError, depending on userInput.
function newSyntaxError (message, userInput = false) {
  return userInput ? new UsageError(message) : new SyntaxError(message)
}

// Create a new TypeError or UsageError, depending on userInput.
function newTypeError (message, userInput = false) {
  return userInput ? new UsageError(message) : new TypeError(message)
}

module.exports = class OptionParser extends events.EventEmitter {
  // ===== Constructor =========================================================

  constructor (object = {}, userInput = false) {
    super()
    this._debug = debug('OptionParser' + id++)
    this._debug('constructor(%j, %j)', object, userInput)
    this._object = OptionParser.toObject(object)
    this._userInput = OptionParser.toBool(userInput)
    this._callbacks = {}
  }

  // ===== Public Class Methods ================================================

  // Cast value to boolean.
  static toBool (value, userInput = false) {
    if (typeof value === 'boolean') {
      return value
    }
    if (typeof value === 'string') {
      value = value.toLowerCase()
    }
    if (value === 'true' || value === 'yes' || value === '1' || value === 1) {
      return true
    }
    if (value === 'false' || value === 'no' || value === '0' || value === 0) {
      return false
    }
    throw newTypeError(`${value}: invalid boolean`, userInput)
  }

  // Cast value to int between min and max.
  static toInt (value, min, max, userInput = false) {
    const number = parseInt(value)
    if (number.toString() !== '' + value) {
      throw newTypeError(`${value}: invalid integer`, userInput)
    }
    if (min != null) {
      if (typeof min !== 'number' || min !== parseInt(min)) {
        throw new TypeError(`${min}: invalid integer`)
      }
      if (number < min) {
        throw newRangeError(`${value}: invalid value < ${min}`, userInput)
      }
      if (max != null) {
        if (typeof max !== 'number' || max !== parseInt(max)) {
          throw new TypeError(`${max}: invalid integer`)
        }
        if (min >= max) {
          throw new RangeError(`${min}, ${max}: invalid range`)
        }
        if (number > max) {
          throw newRangeError(`${value}: invalid value > ${max}`, userInput)
        }
      }
    }
    return value
  }

  // Cast value to string.
  static toString (value, noEmptyString = false, userInput = false) {
    if (typeof value !== 'string') {
      throw newTypeError(`${value}: invalid string`, userInput)
    }
    if (noEmptyString && value === '') {
      throw newRangeError(`invalid empty string`, userInput)
    }
    return value
  }

  // Cast value to hosname:port.
  static toHost (value, userInput = false) {
    OptionParser.toString(value, true, userInput)
    const list = value.split(':')
    const hostname = list[0]
    if (list.length > 2 || hostname === '') {
      throw newRangeError(`${value}: invalid host`, userInput)
    }
    if (list.length < 2) {
      return {hostname: hostname}
    }
    const port = OptionParser.toInt(list[1], 1, null, userInput)
    return {hostname: hostname, port: port}
  }

  // Cast value to path.
  static toPath (value, asString, userInput = false) {
    let path = OptionParser.toString(value, userInput)
    if (path === '/') {
      return asString ? '' : []
    }
    if (path[0] === '/') {
      path = path.substring(1)
    }
    const list = path.split('/')
    for (const element of list) {
      if (element === '') {
        throw newRangeError(`${value}: invalid path`, userInput)
      }
    }
    return asString ? '/' + list.join('/') : list
  }

  // Cast value to Array.
  static toArray (value, userInput = false) {
    if (value == null) {
      return []
    }
    if (typeof value === 'string') {
      return [value]
    }
    if (Array.isArray(value)) {
      return value
    }
    throw newTypeError(`${value}: invalid array`, userInput)
  }

  // Cast value to object.
  static toObject (value, userInput = false) {
    if (typeof value !== 'object' || value == null || Array.isArray(value)) {
      throw newTypeError(`${value}: invalid object`, userInput)
    }
    return value
  }

  // Cast value to function.
  static toFunction (value) {
    if (typeof value !== 'function') {
      throw new TypeError(`${value}: invalid function`)
    }
    return value
  }

  // ===== Public Methods ======================================================

  // Parse options object.
  parse (options) {
    options = OptionParser.toObject(options)
    this._debug('parse(%j)', options)

    for (const key in options) {
      try {
        const value = options[key]
        if (this._callbacks[key] == null) {
          throw newSyntaxError(`invalid key`, this._userInput)
        }
        this._callbacks[key](value)
      } catch (err) {
        if (err instanceof UsageError) {
          this.emit('usageError', `${key}: ${err.message}`)
        } else {
          err.message = `${key}: ${err.message}`
          throw err
        }
      }
    }
    this._debug('parse() => %j', this._object)
  }

  // Define a key that takes a Boolean value.
  boolKey (key) {
    key = this._toKey(key)
    this._debug('boolKey(%j)', key)

    this._callbacks[key] = (value) => {
      this._object[key] = OptionParser.toBool(value, this._userInput)
    }
  }

  // Define a key that takes an enum value.
  enumKey (key) {
    key = this._toKey(key)
    this._debug('enumKey(%j)', key)

    this._callbacks[key] = (value) => {
      const callback = this._callbacks[key].list[value]
      if (callback == null) {
        throw newRangeError(`${value}: invalid ${key}`, this._userInput)
      }
      callback()
    }
    this._callbacks[key].list = {}
  }

  // Define a value for an enum key.
  enumKeyValue (key, value, callback) {
    key = OptionParser.toString(key, true)
    value = OptionParser.toString(value, true)
    OptionParser.toFunction(this._callbacks[key])
    callback = OptionParser.toFunction(callback)
    this._debug('enumKeyValue(%j, %j)', key, value)

    this._callbacks[key].list[value] = callback
  }

  // Define a key that takes a host[:port] value.
  hostKey (key = 'host', hostnameKey = 'hostname', portKey = 'port') {
    key = this._toKey(key)
    hostnameKey = OptionParser.toString(hostnameKey, true)
    portKey = OptionParser.toString(portKey, true)
    this._debug('hostKey(%j, %j, %j)', key, hostnameKey, portKey)

    this._callbacks[key] = (value) => {
      const host = OptionParser.toHost(value, this._userInput)
      this._object[hostnameKey] = host.hostname
      if (host.port != null) {
        this._object[portKey] = host.port
      }
    }
  }

  // Define a key that takes an Integer value.
  intKey (key, min, max) {
    key = this._toKey(key)
    if (min != null) {
      if (typeof min !== 'number' || min !== parseInt(min)) {
        throw new TypeError(`${min}: invalid integer`)
      }
      if (max != null) {
        if (typeof max !== 'number' || max !== parseInt(max)) {
          throw new TypeError(`${max}: invalid integer`)
        }
        if (min >= max) {
          throw new RangeError(`${min}, ${max}: invalid range`)
        }
      }
    }
    this._debug('intKey(%j, %j, %j)', key, min, max)

    this._callbacks[key] = (value) => {
      this._object[key] = OptionParser.toInt(value, min, max, this._userInput)
    }
  }

  // Define a key that takes a path value.
  pathKey (key, asString = false) {
    key = this._toKey(key)
    this._debug('pathKey(%j, %j)', key, asString)

    this._callbacks[key] = (value) => {
      this._object[key] = OptionParser.toPath(value, asString, this._userInput)
    }
  }

  // Define a key that takes a (non-empty) string value.
  stringKey (key, noEmptyString = false) {
    key = this._toKey(key)
    this._debug('stringKey(%j, %j)', key, noEmptyString)

    this._callbacks[key] = (value) => {
      this._object[key] = OptionParser.toString(
        value, noEmptyString, this._userInput
      )
    }
  }

  // ===== Private Methods =====================================================

  // Check that key is valid and unused.
  _toKey (key) {
    if (typeof key !== 'string' || key === '') {
      throw new TypeError(`${key}: invalid string`)
    }
    if (this._callbacks[key] != null) {
      throw new SyntaxError(`${key}: duplicate key`)
    }
    return key
  }
}
