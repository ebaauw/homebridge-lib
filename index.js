// homebridge-lib/index.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2025 Erik Baauw. All rights reserved.

/** Library for Homebridge plugins.
  * see the {@tutorial homebridge-lib} tutorial.
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
  * import { Class } from 'homebridge-lib/Class'
  * ```
  *
  * Note that each class provided by Homebridge Lib is implemented as a
  * separate Javascript module, that is loaded lazily on first use.
  * Due to the way NodeJS deals with circular module dependencies, these modules
  * might not yet be initialised while your module is loading.
  *
  * @module homebridge-lib
  */

/** Convert Error to string.
  *
  * Include the stack trace only for programming errors (JavaScript and NodeJS
  * runtime errors).
  * Translate system errors into more readable messages.
  * @function formatError
  * @param {Error} e - The error.
  * @param {boolean} [useChalk=false] - Use chalk to grey out the stack trace.
  * @returns {string} - The error as string.
  * @memberof module:homebridge-lib
  */
export { formatError } from 'hb-lib-tools'

/** Return the recommended version of NodeJS from package.json.
  * This is the version used to develop and test the software,
  * typically the latest LTS version.
  * @function recommendedNodeVersion
  * @param {string} packageJson - The contents of package.json
  * #return {string} - The recommended version.
  * @memberof module:hbLibTools
  */
export { recommendedNodeVersion } from 'hb-lib-tools'

/** Resolve after given period, delaying execution.
  *
  * E.g. to delay execution for 1.5 seconds, issue:
  * ```javascript
  *   import { timeout } from 'homebridge-lib'
  *
  *   await timeout(1500)
  * ```
  *
  * @function timeout
  * @param {integer} msec - Period (in msec) to wait.
  * @throws {TypeError} On invalid parameter type.
  * @throws {RangeError} On invalid parameter value.
  * @memberof module:homebridge-lib
  */
export { timeout } from 'hb-lib-tools'

/** Convert integer to hex string.
  * @function toHexString
  * @param {integer} i - The integer.
  * @param {integer} [length=4] - The number of digits in the hex string.
  * @returns {string} - The hex string.
  * @memberof module:homebridge-lib
  */
export { toHexString } from 'hb-lib-tools'
