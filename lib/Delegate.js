// homebridge-lib/lib/Delegate.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2025 Erik Baauw. All rights reserved.

import { EventEmitter } from 'node:events'

import { HttpClient } from 'hb-lib-tools/HttpClient'

import { Platform } from 'homebridge-lib/Platform'

/** Abstract superclass for {@link Platform}, {@link AccessoryDelegate},
  * {@link ServiceDelegate}, and {@link CharacteristicDelegate}.
  * <br>See {@link Delegate}.
  * @name Delegate
  * @type {Class}
  * @memberof module:homebridge-lib
  */

/** Abstract superclass for {@link Platform}, {@link AccessoryDelegate},
  * {@link ServiceDelegate}, and {@link CharacteristicDelegate}.
  *
  * `Delegate` provides basic functions for logging and error handling,
  * for accessing HAP-NodeJS classes, and for event handling.
  * `Delegate` extends [EventEmitter](https://nodejs.org/dist/latest-v14.x/docs/api/events.html#events_class_eventemitter).
  * @abstract
  * @extends EventEmitter
  */
class Delegate extends EventEmitter {
  /** Create a new `Delegate` instance.
    * @abstract
    * @param {?Platform} platform - Reference to the corresponding platform
    * plugin instance.<br>
    * Must be non-null, except for instances of `Platform`.
    * @param {?string} name - The name used to prefix log and error messages.
    */
  constructor (platform, name) {
    super()
    if (platform == null) {
      platform = this
    }
    if (!(platform instanceof Platform)) {
      throw new TypeError('platform: not a Platform')
    }
    this._platform = platform
    this.name = name
  }

  /** HomeKit accessory property values.
    * @type {object}
    * @property {Object<string, Accessory.Category>} Categories -
    * Valid HomeKit accessory categories.
    * @readonly
    */
  get Accessory () { return this._platform.Accessory }

  /** HomeKit characteristic property values.
    *
    * @type {object}
    * @property {Object<string, Format>} Formats -
    * Valid HomeKit characteristic formats.
    * @property {Object<string, Perm>} Perms -
    * Valid HomeKit characteristic permissions.
    * @property {Object<string, Unit>} Units -
    * Standard HomeKit characteristic units.
    * @readonly
    */
  get Characteristic () { return this._platform.Characteristic }

  /** Subclasses of {@link Characteristic} for HomeKit characteristic types.
    * @type {object}
    * @property {Object<string, Class>} eve - Subclasses for custom HomeKit
    * characteristic types used by Eve.
    * <br>See {@link EveHomeKitTypes#Characteristics}.
    * @property {Object<string, Class>} hap - Subclasses for standard HomeKit
    * characteristic types.
    * @property {Object<string, Class>} my - Subclasses for my custom HomeKit
    * characteristic typess.
    * <br>See {@link MyHomeKitTypes#Characteristics}.
    * @readonly
    */
  get Characteristics () { return this._platform.Characteristics }

  /** Subclasses of {@link Service} for HomeKit service types.
    * @type {object}
    * @property {Object<string, Class>} eve - Subclasses for custom HomeKit
    * service types used by Eve.
    * <br>See {@link EveHomeKitTypes#Services}.
    * @property {Object<string, Class>} hap - Subclasses for standard HomeKit
    * service types.
    * @property {Object<string, Class>} my - Subclasses for my custom HomeKit
    * characteristic typess.
    * <br>See {@link MyHomeKitTypes#Services}.
    * @readonly
    */
  get Services () { return this._platform.Services }

  /** Current log level.
    *
    * The log level determines what type of messages are printed:
    *
    * 0. Print error and warning messages.
    * 1. Print error, warning, and log messages.
    * 2. Print error, warning, log, and debug messages.
    * 3. Print error, warning, log, debug, and verbose debug messages.
    * 3. Print error, warning, log, debug, verbose debug, and very verbose
    * debug messages.
    *
    * Note that debug messages (level 2, 3 and 4) are only printed when
    * Homebridge was started with the `-D` or `--debug` command line option.
    *
    * The log level defaults at 2.
    *
    * @type {!integer}
    * @readonly
    */
  get logLevel () {
    return 2
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
  }

  /** The name prefix for log messages.
    *  @type {string}
    */
  get _namePrefix () {
    return this._name == null ? '' : this._name + ': '
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

  /** Print a debug message to Homebridge standard output.
    * <br>The message is printed only, when the current log level >= 2 and when
    * Homebridge was started with the `-D` or `--debug` command line option.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  debug (format, ...args) {
    this._platform._message(
      'debug', this.logLevel, this._namePrefix, format, ...args
    )
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
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  error (format, ...args) {
    if (format instanceof HttpClient.HttpError) {
      // Error already emitted by HttpClient.
      return
    }
    this._platform._message(
      'error', this.logLevel, this._namePrefix, format, ...args
    )
  }

  /** Print an error message to Homebridge standard error output and shutdown
    * Homebridge.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  fatal (format, ...args) {
    this._platform._message(
      'fatal', this.logLevel, this._namePrefix, format, ...args
    )
    if (!this._platform._shuttingDown) {
      process.kill(process.pid, 'SIGTERM')
    }
  }

  /** Print a log message to Homebridge standard output.
    * <br>The message is printed only, when the current log level >= 1.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  log (format, ...args) {
    this._platform._message(
      'log', this.logLevel, this._namePrefix, format, ...args
    )
  }

  /** Print a verbose debug message to Homebridge standard output.
    * <br>The message is printed only, when the current log level >= 3 and when
    * Homebridge was started with the `-D` or `--debug` command line option.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  vdebug (format, ...args) {
    this._platform._message(
      'vdebug', this.logLevel, this._namePrefix, format, ...args
    )
  }

  /** Print a very verbose debug message to Homebridge standard output.
    * <br>The message is printed only, when the current log level >= 4 and when
    * Homebridge was started with the `-D` or `--debug` command line option.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  vvdebug (format, ...args) {
    this._platform._message(
      'vvdebug', this.logLevel, this._namePrefix, format, ...args
    )
  }

  /** Print a warning message to Homebridge standard error output.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  warn (format, ...args) {
    this._platform._message(
      'warning', this.logLevel, this._namePrefix, format, ...args
    )
  }
}

export { Delegate }
