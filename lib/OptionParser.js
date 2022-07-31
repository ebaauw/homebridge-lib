// homebridge-lib/lib/OptionParser.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2022 Erik Baauw. All rights reserved.

'use strict'

const events = require('events')
const path = require('path')
const net = require('net')

const noop = () => {}

/** User input error.
  * @hideconstructor
  * @extends Error
  * @memberof OptionParser
  */
class UserInputError extends Error {}

// Create a new RangeError or UserInputError, depending on userInput.
function newRangeError (message, userInput = false) {
  return userInput ? new UserInputError(message) : new RangeError(message)
}

// Create a new SyntaxError or UserInputError, depending on userInput.
function newSyntaxError (message, userInput = false) {
  return userInput ? new UserInputError(message) : new SyntaxError(message)
}

// Create a new TypeError or UserInputError, depending on userInput.
function newTypeError (message, userInput = false) {
  return userInput ? new UserInputError(message) : new TypeError(message)
}

/** Parser and validator for options and other parameters.
  *
  * @extends EventEmitter
  * @emits userInputError
  * @emits warning
  */
class OptionParser extends events.EventEmitter {
  /** Commonly used regular expressions.
    * @type {object}
    * @property {RegExp} hostname - Internet hostname.
    * @property {RegExp} int - Decimal integer.
    * @property {RegExp} intBin - Binary integer, optionally prefixed with `0b`.
    * @property {RegExp} intOct - Octal integer, optionally prefixed with `0o`.
    * @property {RegExp} intHex - Hexadecimal integer, optionally prefixed with `0x`.
    * @property {RegExp} ipv4 - IPv4 address in dot notation.
    * @property {RegExp} number - Number.
    * @property {RegExp} mac - Mac address (EUI-48).
    * @property {RegExp} mac64 - 64-bit mac address (EUI-64).
    * @property {RegExp} uuid - UUID.
    */
  static get patterns () {
    return Object.freeze({
      _host: /^(?:\[(.+)\]|([^:]+))(?::([0-9]{1,5}))?$/,
      hostname: /^[a-zA-Z0-9](:?[a-zA-Z0-9-]*[a-zA-Z0-9])*(:?\.[a-zA-Z0-9](:?[a-zA-Z0-9-]*[a-zA-Z0-9])*)*$/,
      int: /^\s*([+-]?)([0-9]+(?:\.0*)?)\s*$/,
      intBin: /^\s*([+-]?)(?:0[bB])([01]+)\s*$/,
      intOct: /^\s*([+-]?)(?:0[oO])([0-8]+)\s*$/,
      intHex: /^\s*([+-]?)(?:0[xX])([0-9A-Fa-f]+)\s*$/,
      ipv4: /^(\d{1,2}|[01]\d{2}|2[0-4]\d|25[0-5])\.(\d{1,2}|[01]\d{2}|2[0-4]\d|25[0-5])\.(\d{1,2}|[01]\d{2}|2[0-4]\d|25[0-5])\.(\d{1,2}|[01]\d{2}|2[0-4]\d|25[0-5])$/,
      number: /^\s*[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?\s*$/,
      mac: /^([0-9a-fA-F]{1,2})[:-]([0-9a-fA-F]{1,2})[:-]([0-9a-fA-F]{1,2})[:-]([0-9a-fA-F]{1,2})[:-]([0-9a-fA-F]{1,2})[:-]([0-9a-fA-F]{1,2})$/,
      mac64: /^([0-9a-fA-F]{1,2})[:-]([0-9a-fA-F]{1,2})[:-]([0-9a-fA-F]{1,2})[:-]([0-9a-fA-F]{1,2})[:-]([0-9a-fA-F]{1,2})[:-]([0-9a-fA-F]{1,2})[:-]([0-9a-fA-F]{1,2})[:-]([0-9a-fA-F]{1,2})$/,
      uuid: /^([0-9a-fA-F]{8})-([0-9a-fA-F]{4})-([1-5][0-9a-fA-F]{3})-([89abAB][0-9a-fA-F]{3})-([0-9a-fA-F]{12})$/
    })
  }

  static get UserInputError () { return UserInputError }

  /** Casts input value to boolean.
    *
    * Valid input values are:
    * - A boolean;
    * - A number with value 0 (false) or 1 (true);
    * - A string with value 'false', 'no', 'off', or '0' (false); or
    * with value 'true', 'yes', 'on', or '1' (true).
    * @param {!string} key - The key of the input value (for error messages).
    * @param {*} value - The input value.
    * @param {boolean} [userInput=false] - Value was input by user.
    * @returns {boolean} The value as boolean.
    * @throws {TypeError} On invalid input value.
    * @throws {UserError} On error, when value was input by user.
    */
  static toBool (key, value, userInput = false) {
    key === 'key' || key === 'nonEmpty' || OptionParser.toString('key', key, true)
    userInput === false || OptionParser.toBool('userInput', userInput)

    if (value == null) {
      throw newTypeError(`${key}: missing boolean value`, userInput)
    }
    if (typeof value === 'boolean') {
      return value
    }
    if (typeof value === 'string') {
      value = value.toLowerCase()
    }
    if (['true', 'yes', 'on', '1', 1].includes(value)) {
      return true
    }
    if (['false', 'no', 'off', '0', 0].includes(value)) {
      return false
    }
    throw newTypeError(`${key}: not a boolean`, userInput)
  }

  /** Casts input value to integer, optionally clamped between min and max.
    *
    * Valid input values are:
    * - A boolean: false (0) or true (1);
    * - A number with an integer value;
    * - A string holding an integer value in decimal, binary, octal or
    * hexadecimal notation.
    * @param {!string} key - The key of the input value (for error messages).
    * @param {*} value - The input value.
    * @param {?integer} min - Minimum value returned.
    * @param {?integer} max - Maximum value returned.
    * @param {boolean} [userInput=false] - Value was input by user.
    * @returns {integer} The value as integer.
    * @throws {TypeError} On invalid input value.
    * @throws {UserError} On error, when value was input by user.
    */
  static toInt (key, value, min = -Infinity, max = Infinity, userInput = false) {
    OptionParser.toString('key', key, true)
    min === -Infinity || OptionParser.toInt('min', min)
    max === Infinity || OptionParser.toInt('max', max)
    userInput === false || OptionParser.toBool('userInput', userInput)
    if (max < min) {
      throw newRangeError('max: smaller than min')
    }

    if (value == null) {
      throw newTypeError(`${key}: missing integer value`, userInput)
    }
    if (typeof value === 'boolean') {
      value = value ? 1 : 0
    } else if (typeof value === 'number' || typeof value === 'string') {
      if (OptionParser.patterns.int.test(value)) {
        value = parseInt(value)
      } else if (OptionParser.patterns.intHex.test(value)) {
        value = parseInt(value, 16)
      } else if (OptionParser.patterns.intOct.test(value)) {
        const a = OptionParser.patterns.intOct.exec(value)
        value = parseInt(a[1] + a[2], 8)
      } else if (OptionParser.patterns.intBin.test(value)) {
        const a = OptionParser.patterns.intBin.exec(value)
        value = parseInt(a[1] + a[2], 2)
      } else {
        throw newTypeError(`${key}: not an integer`, userInput)
      }
    } else {
      throw newTypeError(`${key}: not an integer`, userInput)
    }
    return Math.min(Math.max(value, min), max)
  }

  /** Converts an integer value to a formatted string.
    *
    * The integer value is converted to a string in the specified radix.
    * The string is prepended with spaces (radix 10) or zeroes (other radix
    * values) to match the minimum length.
    *
    * @param {!string} key - The key of the value (for error messages).
    * @param {integer} value - The input value.
    * @param {integer} [radix=10] - The radix.
    * @param {integer} [length=0] - The minimum length of the formatted string.
    * @param {boolean} [userInput=false] - Value was input by user.
    * @returns {string} The formatted string.
    * @throws {TypeError} On invalid input value.
    */
  static toIntString (key, value, radix = 10, length = 0, userInput = false) {
    radix === 10 || OptionParser.toInt('radix', 2, 36)
    length === 0 || OptionParser.toInt('length', 0, 32)

    if (value < 0 && radix !== 10) {
      throw new RangeError(`${key}: not an unsigned integer`, userInput)
    }
    value = OptionParser.toInt(
      'value', value, undefined, undefined, userInput
    ).toString(radix).toUpperCase()
    if (value.length > length) {
      return value
    }
    const prefix = radix === 10
      ? '                                '
      : '00000000000000000000000000000000'
    return (prefix + value).slice(-length)
  }

  /** Casts input value to number, optionally clamped between min and max.
    *
    * Valid input values are:
    * - A boolean: false (0) or true (1);
    * - A real number (not: NaN, -Infinity, Infinity);
    * - A string holding a number value.
    * @param {!string} key - The key of the input value (for error messages).
    * @param {*} value - The input value.
    * @param {?number} min - Minimum value returned.
    * @param {?number} max - Maximum value returned.
    * @param {boolean} [userInput=false] - Value was input by user.
    * @returns {number} The value as number.
    * @throws {TypeError} On invalid input value.
    * @throws {UserError} On error, when value was input by user.
    */
  static toNumber (key, value, min = -Infinity, max = Infinity, userInput = false) {
    OptionParser.toString('key', key, true)
    min === -Infinity || OptionParser.toNumber('min', min)
    max === Infinity || OptionParser.toNumber('max', max)
    userInput === false || OptionParser.toBool('userInput', userInput)
    if (max < min) {
      throw newRangeError('max: smaller than min')
    }

    if (value == null) {
      throw newTypeError(`${key}: missing number value`, userInput)
    }
    if (typeof value === 'boolean') {
      value = value ? 1 : 0
    } else if (typeof value === 'number' || typeof value === 'string') {
      if (OptionParser.patterns.number.test(value)) {
        value = parseFloat(value)
      } else {
        throw newTypeError(`${key}: not a number`, userInput)
      }
    } else {
      throw newTypeError(`${key}: not a number`, userInput)
    }
    return Math.min(Math.max(value, min), max)
  }

  /** Converts an integer value to a formatted string.
    *
    * The integer value is converted to a string, optionally with a fixed
    * number of decimals.
    * The string is prepended with `0`s to match the minimum length.
    *
    * @param {!string} key - The key of the value (for error messages).
    * @param {integer} value - The input value.
    * @param {integer} [length=0] - The minimum length of the formatted string.
    * @param {?integer} decimals - The fixed number of decimals
    * @param {boolean} [userInput=false] - Value was input by user.
    * @returns {string} The formatted string.
    * @throws {TypeError} On invalid input value.
    */
  static toNumberString (
    key, value, length = 0, decimals = null, userInput = false
  ) {
    OptionParser.toString('key', key, true)
    length === 0 || OptionParser.toInt('length', 0, 32)
    decimals === 0 || OptionParser.toInt('decimals', 0, 16)

    value = OptionParser.toNumber(key, value, undefined, undefined, userInput)
    if (decimals == null) {
      value = value.toString(10)
    } else {
      value = value.toFixed(decimals)
    }
    if (value.length > length) {
      return value
    }
    return ('                                ' + value).slice(-length)
  }

  /** Casts input value to string, optionally non-empty.
    *
    * Valid values are:
    * - A string.
    * - A boolean.
    * - A number.
    * @param {!string} key - The key of the value (for error messages).
    * @param {*} value - The input value.
    * @param {boolean} [nonEmpty=false] - Empty string is invalid value.
    * @param {boolean} [userInput=false] - Value was input by user.
    * @returns {string} The value as string.
    * @throws {TypeError} On invalid input value.
    * @throws {RangeError} On empty string, when noEmptyString has been set.
    * @throws {UserError} On error, when value was input by user.
    */
  static toString (key, value, nonEmpty = false, userInput = false) {
    key === 'key' || OptionParser.toString('key', key, true)
    nonEmpty === false || OptionParser.toBool('nonEmpty', nonEmpty)
    userInput === false || OptionParser.toBool('userInput', userInput)

    if (value == null && nonEmpty) {
      throw newTypeError(`${key}: missing string value`, userInput)
    } else if (value == null) {
      value = ''
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      value = '' + value
    } else if (typeof value !== 'string') {
      throw newTypeError(`${key}: not a string`, userInput)
    }
    if (nonEmpty && value === '') {
      throw newRangeError(`${key}: not a non-empty string`, userInput)
    }
    return value
  }

  /** Casts input value to hostname[:port].
    * @param {!string} key - The key of the value (for error messages).
    * @param {*} value - The input value.
    * @param {boolean} [asString=false] - Return path as string instead of object.
    * @param {boolean} [userInput=false] - Value was input by user.
    * @returns {object|string} The value as { hostname: hostname, port: port }.
    * @throws {TypeError} On invalid input value.
    * @throws {RangeError} On empty string, when noEmptyString has been set.
    * @throws {UserError} On error, when value was input by user.
    */
  static toHost (key, value, asString = false, userInput = false) {
    key === 'key' || OptionParser.toString('key', key, true)
    asString === false || OptionParser.toBool('asString', asString)
    userInput === false || OptionParser.toBool('userInput', userInput)

    OptionParser.toString(key, value, true, userInput)
    const response = {}
    const list = OptionParser.patterns._host.exec(value)
    if (list == null) {
      throw newRangeError(`${key}: not a valid host`, userInput)
    }
    if (list[1] != null) {
      if (!net.isIPv6(list[1])) {
        throw newRangeError(`${key}: [${list[1]}]: not a valid IPv6 address`, userInput)
      }
      response.hostname = '[' + list[1] + ']'
    } else if (net.isIPv4(list[2])) {
      response.hostname = list[2].split('.').map((byte) => {
        return parseInt(byte)
      }).join('.')
    } else if (OptionParser.patterns.hostname.test(list[2])) {
      response.hostname = list[2]
    } else {
      throw newRangeError(`${key}: ${list[2]}: not a valid hostname or IPv4 address`, userInput)
    }
    let host = response.hostname
    if (list[3] != null) {
      const port = parseInt(list[3], 10)
      if (port < 0 || port > 65535) {
        throw newRangeError(`${key}: ${port}: not a valid port`, userInput)
      }
      response.port = port
      host += ':' + port
    }
    return asString ? host : response
  }

  /** Casts input value to path.
    *
    * @param {!string} key - The key of the value (for error messages).
    * @param {*} value - The input value.
    * @param {boolean} [userInput=false] - Value was input by user.
    * @returns {string} The value as normalised resource path.
    * @throws {TypeError} On invalid input value.
    * @throws {RangeError} On empty string, on string not starting with '/'.
    * @throws {UserError} On error, when value was input by user.
    */
  static toPath (key, value, userInput = false) {
    OptionParser.toString('key', key, true)
    userInput === false || OptionParser.toBool('userInput', userInput)

    value = OptionParser.toString(key, value, true, userInput)
    if (value[0] !== '/') {
      throw newRangeError(`${key}: ${value}: not a valid path`, key, value)
    }
    return path.posix.normalize(value)
  }

  /** Casts input value to array.
    *
    * Valid values are:
    * - Null (empty array);
    * - A boolean, number, or string (singleton array);
    * - An array.
    * @param {!string} key - The key of the value (for error messages).
    * @param {*} value - The input value.
    * @param {boolean} [userInput=false] - Value was input by user.
    * @returns {string} The value as array.
    * @throws {TypeError} On invalid input value.
    * @throws {UserError} On error, when value was input by user.
    */
  static toArray (key, value, userInput = false) {
    OptionParser.toString('key', key, true)
    userInput === false || OptionParser.toBool('userInput', userInput)

    if (value == null) {
      return []
    }
    if (['boolean', 'number', 'string'].includes(typeof value)) {
      return [value]
    }
    if (Array.isArray(value)) {
      return value
    }
    throw newTypeError(`${key}: not an array`, userInput)
  }

  /** Casts input value to object.
    *
    * Valid values are:
    * - Null (empty object);
    * - A proper object (i.e. not a class instance).
    * @param {!string} key - The key of the value (for error messages).
    * @param {*} value - The input value.
    * @param {boolean} [userInput=false] - Value was input by user.
    * @returns {Object} The value.
    * @throws {TypeError} On invalid input value.
    * @throws {UserError} On error, when value was input by user.
    */
  static toObject (key, value, userInput = false) {
    OptionParser.toString('key', key, true)
    userInput === false || OptionParser.toBool('userInput', userInput)

    if (value == null) {
      return {}
    }
    if (
      typeof value !== 'object' || value == null ||
      value.constructor.name !== 'Object'
    ) {
      throw newTypeError(`${key}: not an object`, userInput)
    }
    return value
  }

  /** Casts input value to function.
    *
    * Valid values are:
    * - A proper function (i.e. not a class).
    * @param {!string} key - The key of the value (for error messages).
    * @param {*} value - The input value.
    * @returns {function} The value.
    * @throws {TypeError} On invalid input value.
    */
  static toFunction (key, value) {
    OptionParser.toString('key', key, true)

    if (value == null) {
      throw new TypeError(`${key}: missing function value`)
    }
    if (
      typeof value === 'function' && value.prototype == null &&
      value.constructor.name === 'Function'
    ) {
      return value
    }
    throw new TypeError(`${key}: not a function`)
  }

  /** Casts input value to function.
    *
    * Valid values are:
    * - A proper async function.
    * @param {!string} key - The key of the value (for error messages).
    * @param {*} value - The input value.
    * @returns {function} The value.
    * @throws {TypeError} On invalid input value.
    */
  static toAsyncFunction (key, value) {
    OptionParser.toString('key', key, true)

    if (value == null) {
      throw new TypeError(`${key}: missing async function value`)
    }
    if (
      typeof value === 'function' &&
      value.constructor.name === 'AsyncFunction'
    ) {
      return value
    }
    throw new TypeError(`${key}: not an async function`)
  }

  /** Casts input value to class.
    *
    * Valid values are:
    * - A proper Class or function with a prototype.
    * @param {!string} key - The key of the value (for error messages).
    * @param {*} value - The input value.
    * @param {?Class} SuperClass - Check for subclass of SuperClass.
    * @returns {*} The value.
    * @throws {TypeError} On invalid input value.
    */
  static toClass (key, value, SuperClass) {
    OptionParser.toString('key', key, true)
    SuperClass === undefined || OptionParser.toClass('SuperClass', SuperClass)

    if (value == null) {
      throw new TypeError(`${key}: missing class value`)
    }
    if (typeof value !== 'function' || value.prototype == null) {
      throw new TypeError(`${key}: not a class`)
    }
    if (
      SuperClass != null && value !== SuperClass &&
      !(value.prototype instanceof SuperClass)
    ) {
      throw new TypeError(`${key}: not a subclass of ${SuperClass.name}`)
    }
    return value
  }

  /** Casts input value to class instance.
    *
    * Valid values are:
    * - A class instance or a proper function.
    * @param {!string} key - The key of the value (for error messages).
    * @param {*} value - The input value.
    * @param {!Class} Class - Check for instance of Class.
    * @returns {Class} The value.
    * @throws {TypeError} On invalid input value.
    */
  static toInstance (key, value, Class) {
    OptionParser.toString('key', key, true)
    OptionParser.toClass('Class', Class)

    if (value == null) {
      throw new TypeError(`${key}: missing instance of ${Class.name} value`)
    }
    if (value instanceof Class) {
      return value
    }
    throw new TypeError(`${key}: not an instance of ${Class.name}`)
  }

  /** Creates a new OptionParser instance
    *
    * @param {boolean} [userInput=false] - Options were input by user.
    */
  constructor (object = {}, userInput = false) {
    super()
    this._object = OptionParser.toObject('object', object)
    this._userInput = OptionParser.toBool('useerInput', userInput)
    this._callbacks = {}
  }

  /** Checks that key is valid and not yet in use.
    *
    * @param {!string} key - The key.
    * @throws {TypeError} When key is not a string.
    * @throws {RangeError} When key is empty string.
    * @throws {SyntaxError} On duplicate key.
    */
  _toKey (key) {
    key = OptionParser.toString('key', key, true)
    if (this._callbacks[key] != null) {
      throw new SyntaxError(`${key}: duplicate key`)
    }
    return key
  }

  /** Defines a key that takes an array as value.
    *
    * @param {!string} key - The key.
    * @return {OptionParser} this - For chaining.
    * @throws {TypeError} When key is not a string.
    * @throws {RangeError} When key is empty string.
    * @throws {SyntaxError} On duplicate key.
    */
  arrayKey (key) {
    key = this._toKey(key)

    this._callbacks[key] = (value) => {
      this._object[key] = OptionParser.toArray(key, value, this._userInput)
    }
    return this
  }

  /** Defines a key that takes an async function as value.
    *
    * @param {!string} key - The key.
    * @return {OptionParser} this - For chaining.
    * @throws {TypeError} When key is not a string.
    * @throws {RangeError} When key is empty string.
    * @throws {SyntaxError} On duplicate key.
    */
  asyncFunctionKey (key) {
    key = this._toKey(key)

    this._callbacks[key] = (value) => {
      this._object[key] = OptionParser.toAsyncFunction(key, value)
    }
    return this
  }

  /** Defines a key that takes a boolean value.
    *
    * @param {!string} key - The key.
    * @return {OptionParser} this - For chaining.
    * @throws {TypeError} When key is not a string.
    * @throws {RangeError} When key is empty string.
    * @throws {SyntaxError} On duplicate key.
    */
  boolKey (key) {
    key = this._toKey(key)

    this._callbacks[key] = (value) => {
      this._object[key] = OptionParser.toBool(key, value, this._userInput)
    }
    return this
  }

  /** Defines a key that takes an enum value.
    *
    * @param {!string} key - The key.
    * @return {OptionParser} this - For chaining.
    * @throws {TypeError} When key is not a string.
    * @throws {RangeError} When key is empty string.
    * @throws {SyntaxError} On duplicate key.
    */
  enumKey (key) {
    key = this._toKey(key)

    this._callbacks[key] = (value) => {
      value = OptionParser.toString(
        key, value, true, this._userInput
      )
      const callback = this._callbacks[key].list[value]
      if (callback == null) {
        throw newRangeError(`${value}: invalid ${key}`, this._userInput)
      }
      this._object[key] = value
      callback()
    }
    this._callbacks[key].list = {}
    return this
  }

  /** Defines a value for an enum key.
    *
    * @param {!string} key - The key.
    * @param {!string} value - The key.
    * @param {?function} callback - Function to call when enum value is present.
    * @return {OptionParser} this - For chaining.
    * @throws {TypeError} When key is not a string.
    * @throws {RangeError} When key is empty string.
    * @throws {SyntaxError} On duplicate key.
    */
  enumKeyValue (key, value, callback = noop) {
    key = OptionParser.toString('key', key, true)
    value = OptionParser.toString('value', value, true)
    OptionParser.toFunction(key, this._callbacks[key])
    callback = OptionParser.toFunction('callback', callback)

    this._callbacks[key].list[value] = callback
    return this
  }

  /** Defines a key that takes a function as value.
    *
    * @param {!string} key - The key.
    * @return {OptionParser} this - For chaining.
    * @throws {TypeError} When key is not a string.
    * @throws {RangeError} When key is empty string.
    * @throws {SyntaxError} On duplicate key.
    */
  functionKey (key) {
    key = this._toKey(key)

    this._callbacks[key] = (value) => {
      this._object[key] = OptionParser.toFunction(key, value)
    }
    return this
  }

  /** Defines a key that takes a hostname[:port] as value.
    *
    * @param {!string} key - The key.
    * @param {string} [hostnameKey=hostname] - The key for the hostname.
    * @param {string} [portKey=port] - The key for the port.
    * @return {OptionParser} this - For chaining.
    * @throws {TypeError} When key is not a string.
    * @throws {RangeError} When key is empty string.
    * @throws {SyntaxError} On duplicate key.
    */
  hostKey (key = 'host', hostnameKey = 'hostname', portKey = 'port') {
    key = this._toKey(key)
    hostnameKey = OptionParser.toString('hostnameKey', hostnameKey, true)
    portKey = OptionParser.toString('portKey', portKey, true)

    this._callbacks[key] = (value) => {
      const host = OptionParser.toHost(key, value, false, this._userInput)
      this._object[hostnameKey] = host.hostname
      if (host.port != null) {
        this._object[portKey] = host.port
      }
    }
    return this
  }

  /** Defines a key that takes an integer value,
    * optionally clamped between min and max.
    *
    * @param {!string} key - The key.
    * @param {!Class} Class - Check for instance of Class.
    * @return {OptionParser} this - For chaining.
    * @throws {TypeError} When key is not a string.
    * @throws {RangeError} When key is empty string.
    * @throws {SyntaxError} On duplicate key.
    */
  instanceKey (key, Class) {
    key = this._toKey(key)
    Class = OptionParser.toClass('Class', Class)

    this._callbacks[key] = (value) => {
      this._object[key] = OptionParser.toInstance(key, value, Class)
    }
    return this
  }

  /** Defines a key that takes an integer value,
    * optionally clamped between min and max.
    *
    * @param {!string} key - The key.
    * @param {?integer} min - Minimum value returned.
    * @param {?integer} max - Maximum value returned.
    * @return {OptionParser} this - For chaining.
    * @throws {TypeError} When key is not a string.
    * @throws {RangeError} When key is empty string.
    * @throws {SyntaxError} On duplicate key.
    */
  intKey (key, min, max) {
    key = this._toKey(key)
    min = min == null ? -Infinity : OptionParser.toInt('min', min)
    max = max == null ? Infinity : OptionParser.toInt('max', max)
    if (max < min) {
      throw newRangeError('max: smaller than min')
    }

    this._callbacks[key] = (value) => {
      this._object[key] = OptionParser.toInt(key, value, min, max, this._userInput)
    }
    return this
  }

  /** Defines a key that takes a list of strings as value.
    *
    * @param {!string} key - The key.
    * @return {OptionParser} this - For chaining.
    * @throws {TypeError} When key is not a string.
    * @throws {RangeError} When key is empty string.
    * @throws {SyntaxError} On duplicate key.
    */
  listKey (key) {
    key = this._toKey(key)

    this._callbacks[key] = (value) => {
      const array = []
      const map = {}
      for (const element of OptionParser.toArray(key, value)) {
        try {
          OptionParser.toString(`${key}.${element}`, element, true, this._userInput)
          if (map[element]) {
            throw newSyntaxError(`${key}.${element}: duplicate key`, this._userInput)
          }
          map[element] = true
          array.push(element)
        } catch (error) {
          if (error instanceof UserInputError) {
            this.emit('userInputError', `${key}: ${error.message}`)
          } else {
            throw error
          }
        }
      }
      this._object[key] = array
    }
    return this
  }

  /** Defines a key that takes an object as value.
    *
    * @param {!string} key - The key.
    * @return {OptionParser} this - For chaining.
    * @throws {TypeError} When key is not a string.
    * @throws {RangeError} When key is empty string.
    * @throws {SyntaxError} On duplicate key.
    */
  objectKey (key) {
    key = this._toKey(key)

    this._callbacks[key] = (value) => {
      this._object[key] = OptionParser.toObject(key, value, this._userInput)
    }
    return this
  }

  /** Defines a key that takes a resource path as value.
    *
    * @param {!string} key - The key.
    * @return {OptionParser} this - For chaining.
    * @throws {TypeError} When key is not a string.
    * @throws {RangeError} When key is empty string.
    * @throws {SyntaxError} On duplicate key.
    */
  pathKey (key) {
    key = this._toKey(key)

    this._callbacks[key] = (value) => {
      this._object[key] = OptionParser.toPath(key, value, this._userInput)
    }
    return this
  }

  /** Defines a key that takes a string value.
    *
    * @param {!string} key - The key.
    * @param {boolean} [nonEmpty=false] - Reject empty string.
    * @return {OptionParser} this - For chaining.
    * @throws {TypeError} When key is not a string.
    * @throws {RangeError} When key is empty string.
    * @throws {SyntaxError} On duplicate key.
    */
  stringKey (key, nonEmpty = false) {
    key = this._toKey(key)

    this._callbacks[key] = (value) => {
      this._object[key] = OptionParser.toString(
        key, value, nonEmpty, this._userInput
      )
    }
    return this
  }

  /** Parse options.
    *
    * @param {object} options - The input options.
    * @param {?object} defaults - The default values, to be overwritten by
    * the corresponding values in `options`.
    * @returns {object} The
    * @throws {TypeError} When option has wrong type.
    * @throws {RangeError} When option has wrong value.
    * @throws {SyntaxError} Unknown option.
    * @throws {UserError} On error, when value was input by user.
    */
  parse (options) {
    options = OptionParser.toObject('options', options)

    for (const key in options) {
      try {
        const value = options[key]
        if (this._callbacks[key] == null) {
          throw newSyntaxError(`${key}: invalid key`, this._userInput)
        }
        this._callbacks[key](value)
      } catch (error) {
        if (error instanceof UserInputError) {
          // this.emit('userInputError', `${key}: ${error.message}`)
          this.emit('userInputError', error)
        } else {
          // error.message = `${key}: ${error.message}`
          throw error
        }
      }
    }
    return this._object
  }
}

module.exports = OptionParser
