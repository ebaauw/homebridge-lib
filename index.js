// homebridge-lib/index.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2020 Erik Baauw. All rights reserved.

'use strict'

/** Library for Homebridge plugins.
  * see the {@tutorial homebridge-lib} tutorial.
  *
  * `homebridge-lib` provides:
  * - A series of base classes for building Homebridge dynamic platform plugins:
  * {@link Platform},
  * {@link AccessoryDelegate},
  * {@link ServiceDelegate}, and
  * {@link CharacteristicDelegate}.
  * - A base class to building command-line tools:
  * {@link CommandLineTool}.
  * - A series of helper classes for building homebridge plugins (of any type)
  * and/or command-line utilities:
  * {@link CommandLineParser},
  * {@link EveHomeKitTypes},
  * {@link JsonFormatter},
  * {@link MyHomeKitTypes},
  * {@link OptionParser},
  * {@link RestClient}, and
  * {@link UpnpClient}.
  * - A series of command-line utilities for troubleshooting Homebridge setups:
  * `hap`, `json`, `upnp`.
  * For more information on these, start the tool from the command-line
  * with `-h` or `--help`.
  *
  * To access the classes provided by `homebridge-lib` from your module,
  * simply load it by:
  * ```javascript
  * const homebridgeLib = require('homebridge-lib')
  * ```
  *
  * Note that each class provided by `homebridge-lib` is implemented as a
  * separate Javascript module, that is loaded lazily on first use.
  * Due to the way NodeJS deals with circular module dependencies, these modules
  * might not yet be initialised while your module is loading.
  *
  * @module homebridge-lib
  */
class homebridgeLib {
  /** Abstract superclass for a Homebridge dynamic platform plugin.
    * <br>See {@link Platform}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get Platform () { return require('./lib/Platform') }

  /** Abstract superclass for a HomeKit accessory delegate.
    * <br>See {@link AccessoryDelegate}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get AccessoryDelegate () { return require('./lib/AccessoryDelegate') }

  /** Abstract superclass for a HomeKit service delegate.
    * <br>See {@link ServiceDelegate}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get ServiceDelegate () { return require('./lib/ServiceDelegate') }

  /** HomeKit characteristic delegate.
    * <br>See {@link CharacteristicDelegate}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get CharacteristicDelegate () { return require('./lib/CharacteristicDelegate') }

  /** Abstract superclass for {@link Platform}, {@link AccessoryDelegate},
    * {@link ServiceDelegate}, and {@link CharacteristicDelegate}.
    * <br>See {@link Delegate}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get Delegate () { return require('./lib/Delegate') }

  /** Parser and validator for command-line arguments.
    * <br>See {@link CommandLineParser}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get CommandLineParser () { return require('./lib/CommandLineParser') }

  /**  Abstract superclass for a command-line tool.
    * <br>See {@link CommandLineTool}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get CommandLineTool () { return require('./lib/CommandLineTool') }

  /** HTTP client.
    * <br>See {@link HttpClient}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get HttpClient () { return require('./lib/HttpClient') }

  /** JSON formatter.
    * <br>See {@link JsonFormatter}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get JsonFormatter () { return require('./lib/JsonFormatter') }

  /** Parser and validator for options and other parameters.
    * <br>See {@link OptionParser}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get OptionParser () { return require('./lib/OptionParser') }

  /** REST API client.
    * <br>See {@link RestClient}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get RestClient () { return require('./lib/RestClient') }

  /** Universal Plug and Play client.
    * <br>See {@link UpnpClient}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get UpnpClient () { return require('./lib/UpnpClient') }

  /** Abstract superclass for {@link EveHomeKitTypes}
    * and {@link MyHomeKitTypes}.
    * <br>See {@link CustomHomeKitTypes}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get CustomHomeKitTypes () { return require('./lib/CustomHomeKitTypes') }

  /** Custom HomeKit services and characteristics used by
    * [Eve](https://www.evehome.com/en) accessories and by the
    * [Eve app](https://www.evehome.com/en/eve-app).
    * <br>See {@link EveHomeKitTypes}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get EveHomeKitTypes () { return require('./lib/EveHomeKitTypes') }

  /** My own collection of custom HomeKit services and characteristics.
    * <br>See {@link MyHomeKitTypes}.
    * @type {Class}
    * @memberof module:homebridge-lib
    */
  static get MyHomeKitTypes () { return require('./lib/MyHomeKitTypes') }
}

module.exports = homebridgeLib
