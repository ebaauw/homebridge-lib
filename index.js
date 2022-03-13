// homebridge-lib/index.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2022 Erik Baauw. All rights reserved.

'use strict'

const chalk = require('chalk')
const net = require('net')

// Force colors when output is re-directed.
chalk.enabled = true
chalk.level = 1

// Check of e is a JavaScript runtime error.
function isJavaScriptError (e) {
  return [
    'AssertionError',
    'EvalError',
    'RangeError',
    'ReferenceError',
    'SyntaxError',
    'TypeError',
    'URIError'
  ].includes(e.constructor.name)
}

// Check if e is a NodeJs runtime error.
function isNodejsError (e) {
  return typeof e.code === 'string' && e.code.startsWith('ERR_')
}

const zeroes = '00000000000000000000000000000000'

/** Library for Homebridge plugins.
  * see the {@tutorial homebridgeLib} tutorial.
  *
  * Homebridge Lib provides:
  * - A series of base classes for building Homebridge dynamic platform plugins:
  * {@link Platform},
  * {@link AccessoryDelegate},
  * {@link ServiceDelegate}, and
  * {@link CharacteristicDelegate}.
  * - A base class to building command-line tools:
  * {@link CommandLineTool}.
  * - A series of helper classes for building homebridge plugins (of any type)
  * and/or command-line utilities:
  * {@link AdaptiveLighting},
  * {@link Colour},
  * {@link CommandLineParser},
  * {@link EveHomeKitTypes},
  * {@link HttpClient},
  * {@link JsonFormatter},
  * {@link MyHomeKitTypes},
  * {@link OptionParser}, and
  * {@link UpnpClient}.
  * - A series of command-line utilities for troubleshooting Homebridge setups:
  * `hap`, `json`, `upnp`.
  * For more information on these, start the tool from the command-line
  * with `-h` or `--help`.
  *
  * To access the classes provided by Homebridge Lib from your module,
  * simply load it by:
  * ```javascript
  * const homebridgeLib = require('homebridge-lib')
  * ```
  *
  * Note that each class provided by Homebridge Lib is implemented as a
  * separate Javascript module, that is loaded lazily on first use.
  * Due to the way NodeJS deals with circular module dependencies, these modules
  * might not yet be initialised while your module is loading.
  *
  * @module homebridgeLib
  */
class homebridgeLib {
  /** Delegate of a HomeKit accessory.
    * <br>See {@link AccessoryDelegate}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get AccessoryDelegate () { return require('./lib/AccessoryDelegate') }

  /** Adaptive Lighting.
    * <br>See {@link AdaptiveLighting}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get AdaptiveLighting () { return require('./lib/AdaptiveLighting') }

  /** Delegate of a HomeKit characteristic.
    * <br>See {@link CharacteristicDelegate}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get CharacteristicDelegate () { return require('./lib/CharacteristicDelegate') }

  /** Colour conversions.
    * <br>See {@link Colour}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get Colour () { return require('./lib/Colour') }

  /** Parser and validator for command-line arguments.
    * <br>See {@link CommandLineParser}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get CommandLineParser () { return require('./lib/CommandLineParser') }

  /** Command-line tool.
    * <br>See {@link CommandLineTool}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get CommandLineTool () { return require('./lib/CommandLineTool') }

  /** Abstract superclass for {@link EveHomeKitTypes}
    * and {@link MyHomeKitTypes}.
    * <br>See {@link CustomHomeKitTypes}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get CustomHomeKitTypes () { return require('./lib/CustomHomeKitTypes') }

  /** Abstract superclass for {@link Platform}, {@link AccessoryDelegate},
    * {@link ServiceDelegate}, and {@link CharacteristicDelegate}.
    * <br>See {@link Delegate}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get Delegate () { return require('./lib/Delegate') }

  /** Custom HomeKit services and characteristics used by
    * [Eve](https://www.evehome.com/en) accessories and by the
    * [Eve app](https://www.evehome.com/en/eve-app).
    * <br>See {@link EveHomeKitTypes}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get EveHomeKitTypes () { return require('./lib/EveHomeKitTypes') }

  /** HTTP client.
    * <br>See {@link HttpClient}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get HttpClient () { return require('./lib/HttpClient') }

  /** JSON formatter.
    * <br>See {@link JsonFormatter}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get JsonFormatter () { return require('./lib/JsonFormatter') }

  /** My own collection of custom HomeKit services and characteristics.
    * <br>See {@link MyHomeKitTypes}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get MyHomeKitTypes () { return require('./lib/MyHomeKitTypes') }

  /** Parser and validator for options and other parameters.
    * <br>See {@link OptionParser}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get OptionParser () { return require('./lib/OptionParser') }

  /** Homebridge dynamic platform plugin.
    * <br>See {@link Platform}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get Platform () { return require('./lib/Platform') }

  /** Delegate of a property of a HomeKit accessory or service.
    * <br>See {@link PropertyDelegate}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get PropertyDelegate () { return require('./lib/PropertyDelegate') }

  /** Delegate of a HomeKit service.
    * <br>See {@link ServiceDelegate}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get ServiceDelegate () { return require('./lib/ServiceDelegate') }

  /** System information.
    * <br>See {@link SystemInfo}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get SystemInfo () { return require('./lib/SystemInfo') }

  /** Server for dynamic configuration settings through Homebridge UI.
    * <br>See {@link UiServer}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get UiServer () { return require('./lib/UiServer') }

  /** Universal Plug and Play client.
    * <br>See {@link UpnpClient}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get UpnpClient () { return require('./lib/UpnpClient') }

  /** Resolve after given period, delaying execution.
    *
    * E.g. to delay execution for 1.5 seconds, issue:
    * ```javascript
    *   await homebridgeLib.timeout(1500)
    * ```
    *
    * @param {integer} msec - Period (in msec) to wait.
    * @throws {TypeError} On invalid parameter type.
    * @throws {RangeError} On invalid parameter value.
    * @memberof module:homebridgeLib
    */
  static async timeout (msec) {
    msec = homebridgeLib.OptionParser.toInt('msec', msec, 0)
    return new Promise((resolve, reject) => {
      setTimeout(() => { resolve() }, msec)
    })
  }

  /** Convert Error to string.
    *
    * Include the stack trace only for programming errors (JavaScript and NodeJS
    * runtime errors).
    * Translate system errors into more readable messages.
    * @param {Error} e - The error.
    * @param {boolean} [useChalk=false] - Use chalk to grey out the stack trace.
    * @returns {string} - The error as string.
    * @memberof module:homebridgeLib
    */
  static formatError (e, useChalk = false) {
    if (isJavaScriptError(e) || isNodejsError(e)) {
      if (useChalk) {
        const lines = e.stack.split('\n')
        const firstLine = lines.shift()
        return firstLine + '\n' + chalk.reset.grey(lines.join('\n'))
      }
      return e.stack
    }
    if (e.errno != null) { // SystemError
      let label = ''
      if (e.path != null) {
        label = e.path
      } else if (e.dest != null) {
        label = e.dest
      } else if (e.address != null) {
        label = e.address
        if (net.isIPv6(label)) {
          label = '[' + label + ']'
        }
        if (e.port != null) {
          label += ':' + e.port
        }
      } else if (e.port != null) {
        label = '' + e.port
      } else if (e.hostname != null) {
        label = e.hostname
      }
      let message = ''
      const a = /[A-Z0-9_-]*:( .*),/.exec(e.message)
      if (a != null && a[1] != null) {
        message = a[1]
      }
      if (label != null && message != null) {
        return `${label}: cannot ${e.syscall}: ${e.code}${message}`
      }
    }
    if (e.cmd != null && e.message.slice(-1) === '\n') { // exec error
      return e.message.slice(0, e.message.length - 1)
    }
    return e.message
  }

  /** Convert integer to hex string.
    * @param {integer} i - The integer.
    * @param {integer} [length=4] - The number of digits in the hex string.
    * @returns {string} - The hex string.
    * @memberof module:homebridgeLib
    */
  static toHexString (i, length = 4) {
    return (zeroes + i.toString(16)).slice(-length).toUpperCase()
  }
}

module.exports = homebridgeLib
