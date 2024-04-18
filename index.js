// homebridge-lib/index.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2024 Erik Baauw. All rights reserved.

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
  * import homebridgeLib from 'homebridge-lib'
  * ```
  *
  * Note that each class provided by Homebridge Lib is implemented as a
  * separate Javascript module, that is loaded lazily on first use.
  * Due to the way NodeJS deals with circular module dependencies, these modules
  * might not yet be initialised while your module is loading.
  *
  * @module homebridgeLib
  */

/** Abstract superclass for {@link Platform}, {@link AccessoryDelegate},
  * {@link ServiceDelegate}, and {@link CharacteristicDelegate}.
  * <br>See {@link Delegate}.
  * @name Delegate
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { Delegate } from './lib/Delegate.js'

/** Delegate of a HomeKit accessory.
  * <br>See {@link AccessoryDelegate}.
  * @name AccessoryDelegate
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { AccessoryDelegate } from './lib/AccessoryDelegate.js'

/** Adaptive Lighting.
  * <br>See {@link AdaptiveLighting}.
  * @name AdaptiveLighting
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { AdaptiveLighting } from './lib/AdaptiveLighting.js'

/** Return the `Bonjour` class from [`bonjour-hap`](https://github.com/homebridge/bonjour),
  * so plugins don't have to list this as a separate dependency.
  * @name Bonjour
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { Bonjour } from 'hb-lib-tools'

/** Delegate of a HomeKit characteristic.
  * <br>See {@link CharacteristicDelegate}.
  * @name CharacteristicDelegate
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { CharacteristicDelegate } from './lib/CharacteristicDelegate.js'

/** Colour conversions.
  * <br>See {@link Colour}.
  * @name Colour
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { Colour } from 'hb-lib-tools'

/** Parser and validator for command-line arguments.
  * <br>See {@link CommandLineParser}.
  * @name CommandLineParser
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { CommandLineParser } from 'hb-lib-tools'

/** Command-line tool.
  * <br>See {@link CommandLineTool}.
  * @name CommandLineTool
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { CommandLineTool } from 'hb-lib-tools'

/** Abstract superclass for {@link EveHomeKitTypes}
  * and {@link MyHomeKitTypes}.
  * <br>See {@link CustomHomeKitTypes}.
  * @name CustomHomeKitTypes
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { CustomHomeKitTypes } from './lib/CustomHomeKitTypes.js'

/** Custom HomeKit services and characteristics used by
  * [Eve](https://www.evehome.com/en) accessories and by the
  * [Eve app](https://www.evehome.com/en/eve-app).
  * <br>See {@link EveHomeKitTypes}.
  * @name EveHomeKitTypes
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { EveHomeKitTypes } from './lib/EveHomeKitTypes.js'

/** HTTP client.
  * <br>See {@link HttpClient}.
  * @name HttpClient
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { HttpClient } from 'hb-lib-tools'

/** JSON formatter.
  * <br>See {@link JsonFormatter}.
  * @name JsonFormatter
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { JsonFormatter } from 'hb-lib-tools'

/** My own collection of custom HomeKit services and characteristics.
  * <br>See {@link MyHomeKitTypes}.
  * @name MyHomeKitTypes
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { MyHomeKitTypes } from './lib/MyHomeKitTypes.js'

/** Parser and validator for options and other parameters.
  * <br>See {@link OptionParser}.
  * @name OptionParser
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { OptionParser } from 'hb-lib-tools'

/** Homebridge dynamic platform plugin.
  * <br>See {@link Platform}.
  * @name Platform
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { Platform } from './lib/Platform.js'

/** Delegate of a property of a HomeKit accessory or service.
  * <br>See {@link PropertyDelegate}.
  * @name PropertyDelegate
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { PropertyDelegate } from './lib/PropertyDelegate.js'

/** Delegate of a HomeKit service.
  * <br>See {@link ServiceDelegate}.
  * @name ServiceDelegate
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { ServiceDelegate } from './lib/ServiceDelegate/index.js'

/** System information.
  * <br>See {@link SystemInfo}.
  * @name SystemInfo
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { SystemInfo } from 'hb-lib-tools'

/** Universal Plug and Play client.
  * <br>See {@link UpnpClient}.
  * @name UpnpClient
  * @type {Class}
  * @memberof module:homebridgeLib
  */
export { UpnpClient } from 'hb-lib-tools'

// /** Server for dynamic configuration settings through Homebridge UI.
//   * <br>See {@link UiServer}.
//   * @name UiServer
//   * @type {Class}
//   * @memberof module:homebridgeLib
//   */
// export { UiServer } from './lib/UiServer.js'

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
export { formatError } from 'hb-lib-tools'

/** Return the recommended version of NodeJS from package.json.
  * This is the version used to develop and test the software,
  * typically the latest LTS version.
  * @param {string} packageJson - The contents of package.json
  * #return {string} - The recommended version.
  * @memberof module:hbLibTools
  */
export { recommendedNodeVersion } from 'hb-lib-tools'

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
export { timeout } from 'hb-lib-tools'

/** Convert integer to hex string.
  * @param {integer} i - The integer.
  * @param {integer} [length=4] - The number of digits in the hex string.
  * @returns {string} - The hex string.
  * @memberof module:homebridgeLib
  */
export { toHexString } from 'hb-lib-tools'

/** Return the [`chalk`](https://github.com/chalk/chalk) module,
  * so plugins don't have to list this as a separate dependency.
  * @memberof module:homebridgeLib
  */
export { chalk } from 'hb-lib-tools'

/** Return the [`semver`](https://github.com/npm/node-semver) module,
  * so plugins don't have to list this as a separate dependency.
  * @memberof module:homebridgeLib
  */
export { semver } from 'hb-lib-tools'

export { AccessoryInformation } from './lib/ServiceDelegate/AccessoryInformation.js'
export { Battery } from './lib/ServiceDelegate/Battery.js'
export { Dummy } from './lib/ServiceDelegate/Dummy.js'
export { History } from './lib/ServiceDelegate/History.js'
export { ServiceLabel } from './lib/ServiceDelegate/ServiceLabel.js'
