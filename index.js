// homebridge-lib/index.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2023 Erik Baauw. All rights reserved.

'use strict'

const hbLibTools = require('hb-lib-tools')

/** Library for Homebridge plugins.
  * see the {@tutorial homebridgeLib} tutorial.
  *
  * Homebridge Lib provides:
  * - A series of base classes for building Homebridge dynamic platform plugins:
  * {@link Platform},
  * {@link AccessoryDelegate},
  * {@link ServiceDelegate}, and
  * {@link CharacteristicDelegate}.
  * - An abstract base class to building command-line tools:
  * {@link CommandLineTool}.
  * - A series of helper classes for building homebridge plugins (of any type)
  * and/or command-line utilities:
  * {@link AdaptiveLighting},
  * {@link Colour},
  * {@link CommandLineParser},
  * {@link CustomHomeKitTypes},
  * {@link Delegate},
  * {@link EveHomeKitTypes},
  * {@link HttpClient},
  * {@link JsonFormatter},
  * {@link MyHomeKitTypes},
  * {@link OptionParser},
  * {@link PropertyDelegate},
  * {@link SystemInfo},
  * {@link UiServer}, and
  * {@link UpnpClient}.
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

  /** Return the `Bonjour` class from [`bonjour-hap`](https://github.com/homebridge/bonjour),
    * so plugins don't have to list this as a separate dependency.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get Bonjour () { return hbLibTools.Bonjour }

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
  static get Colour () { return hbLibTools.Colour }

  /** Parser and validator for command-line arguments.
    * <br>See {@link CommandLineParser}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get CommandLineParser () { return hbLibTools.CommandLineParser }

  /** Command-line tool.
    * <br>See {@link CommandLineTool}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get CommandLineTool () { return hbLibTools.CommandLineTool }

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
  static get HttpClient () { return hbLibTools.HttpClient }

  /** JSON formatter.
    * <br>See {@link JsonFormatter}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get JsonFormatter () { return hbLibTools.JsonFormatter }

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
  static get OptionParser () { return hbLibTools.OptionParser }

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
  static get SystemInfo () { return hbLibTools.SystemInfo }

  /** Universal Plug and Play client.
    * <br>See {@link UpnpClient}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get UpnpClient () { return hbLibTools.UpnpClient }

  /** Server for dynamic configuration settings through Homebridge UI.
    * <br>See {@link UiServer}.
    * @type {Class}
    * @memberof module:homebridgeLib
    */
  static get UiServer () { return require('./lib/UiServer') }

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
  static get timeout () { return hbLibTools.timeout }

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
  static get formatError () { return hbLibTools.formatError }

  /** Convert integer to hex string.
    * @param {integer} i - The integer.
    * @param {integer} [length=4] - The number of digits in the hex string.
    * @returns {string} - The hex string.
    * @memberof module:homebridgeLib
    */
  static get toHexString () { return hbLibTools.toHexString }

  /** Return the [`chalk`](https://github.com/chalk/chalk) module,
    * so plugins don't have to list this as a separate dependency.
    * @memberof module:homebridgeLib
    */
  static get chalk () { return hbLibTools.chalk }

  /** Return the [`semver`](https://github.com/npm/node-semver) module,
    * so plugins don't have to list this as a separate dependency.
    * @memberof module:homebridgeLib
    */
  static get semver () { return hbLibTools.semver }

  /** Return the recommended version of NodeJS from package.json.
    * This is the version used to develop and test the software,
    * typically the latest LTS version.
    * @param {string} packageJson - The contents of package.json
    * #return {string} - The recommended version.
    * @memberof module:hbLibTools
    */
  static get recommendedNodeVersion () { return hbLibTools.recommendedNodeVersion }
}

module.exports = homebridgeLib
