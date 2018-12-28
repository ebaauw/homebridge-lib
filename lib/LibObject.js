// homebridge-lib/lib/Delegate.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2019 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

const events = require('events')

/** Abstract superclass for {@link Platform}, {@link AccessoryDelegate},
  * {@link ServiceDelegate}, and {@link CharacteristicDelegate}.
  *
  * `Delegate` provides basic functions for logging and error handling,
  * for accessing HAP-NodeJS classes, and for event handling.
  * `Delegate` extends [EventEmitter](https://nodejs.org/dist/latest-v10.x/docs/api/events.html#events_class_eventemitter).
  * @abstract
  * @extends EventEmitter
  */
class Delegate extends events.EventEmitter {
  /** Create a new `Delegate` instance.
    * @abstract
    * @param {Platform} platform - Reference to the corresponding platform
    * plugin instance.<br>
    * Must be non-null, except for the `Platform` instance itself.
    * @param {string} name - The name used to prefix log and error messages.
    */
  constructor (platform, name) {
    super()
    if (platform == null) {
      platform = this
    }
    if (!(platform instanceof homebridgeLib.Platform)) {
      throw new TypeError('platform: not a Platform')
    }
    this._platform = platform
    this.name = name
  }

  /** HomeKit accessory properties.
    * @type {object}
    * @property {object} Categories - Values for HomeKit accessory category, from
    * [HAP-NodeJS](https://github.com/KhaosT/HAP-NodeJS/blob/9eaea6df40811ccc71664a1ab0c13736e759dac7/lib/Accessory.js#L87).
    */
  get Accessory () {
    return this._platform.Accessory
  }

  /** HomeKit characteristics and characteristic properties.
    * @type {object}
    * @property {Formats} Formats - Standard values for HomeKit characteristic
    * format, from [HAP-NodeJS](https://github.com/KhaosT/HAP-NodeJS/blob/9eaea6df40811ccc71664a1ab0c13736e759dac7/lib/Characteristic.js#L67).
    * @property {Perms} Perms - Values for HomeKit characteristic permissions,
    * from [HAP-NodeJS](https://github.com/KhaosT/HAP-NodeJS/blob/9eaea6df40811ccc71664a1ab0c13736e759dac7/lib/Characteristic.js#L93).
    * @property {Units} Units - Standard values for HomeKit characteristic unit,
    * from [HAP-NodeJS](https://github.com/KhaosT/HAP-NodeJS/blob/9eaea6df40811ccc71664a1ab0c13736e759dac7/lib/Characteristic.js#L83).
    * @property {object} eve - Custom HomeKit characteristics used by the
    * [Eve](https://www.evehome.com/en/eve-app) app, from
    * {@link EveHomeKitTypes#Characteristic EveHomeKitTypes}.
    * @property {object} hap - Standard HomeKit characteristics, from
    * [HAP-NodeJS](https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/gen/HomeKitTypes.js).
    * @property {object} my - My collection of custom HomeKit characteristics,
    * from {@link MyHomeKitTypes#Characteristic MyHomeKitTypes}.
    */
  get Characteristic () {
    return this._platform.Characteristic
  }

  /** HomeKit services.
    * @type {object}
    * @property {object} eve - Custom HomeKit services used by the
    * [Eve](https://www.evehome.com/en/eve-app) app, from
    * {@link EveHomeKitTypes#Service EveHomeKitTypes}.
    * @property {object} hap - Standard HomeKit services, from
    * [HAP-NodeJS](https://github.com/KhaosT/HAP-NodeJS/blob/master/lib/gen/HomeKitTypes.js).
    * @property {object} my - My collection of custom HomeKit services, from
    * {@link MyHomeKitTypes#Service MyHomeKitTypes}.
    */
  get Service () {
    return this._platform.Service
  }

  /** The name used to prefix log and error messages.
    * @type {string}
    */
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

  /** Reference to the corresponding platform plugin instance.
    *
    * For instances of `Platform`, it returns `this`.
    * @type {!Platform}
    * @readonly
    */
  get platform () {
    return this._platform
  }

  /** Name of the (final) class of this instance.
    * @type {!string}
    * @readonly
    */
  get className () {
    return this.constructor.name
  }

  /** Print a debug message to Homebridge standard output, when Homebridge was
    * started with the `-D` or `--debug` command line option.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v10.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  debug (format, ...args) {
    this._platform._message('debug', this._namePrefix, format, ...args)
  }

  /** Safely emit an event, catching any errors.
    * @param {!string} eventName - The name of the event.
    * @param {...string} args - Arguments to the event.
    */
  emit (eventName, ...args) {
    try {
      super.emit(eventName, ...args)
    } catch (error) {
      this.error(error)
    }
  }

  /** Print an error message to Homebridge standard error output.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v10.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  error (format, ...args) {
    this._platform._message('error', this._namePrefix, format, ...args)
  }

  /** Print an error message to Homebridge standard error output and shutdown
    * Homebridge.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v10.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  fatal (format, ...args) {
    this._platform._message('fatal', this._namePrefix, format, ...args)
    if (!this._platform._shuttingDown) {
      process.kill(process.pid, 'SIGTERM')
    }
  }

  /** Print a log message to Homebridge standard output.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v10.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  log (format, ...args) {
    this._platform._message('log', this._namePrefix, format, ...args)
  }

  /** Print a warning message to Homebridge standard error output.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v10.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  warn (format, ...args) {
    this._platform._message('warning', this._namePrefix, format, ...args)
  }
}

module.exports = Delegate
