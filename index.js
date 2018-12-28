// homebridge-lib/index.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2019 Erik Baauw. All rights reserved.

'use strict'

/** Entry point for `homebridgeLib`, see the {@tutorial homebridgeLib} tutorial.
  *
  * @module homebridge-lib
  * @property {Class} Platform - Abstract superclass for a Homebridge dynamic platform plugin.<br>
  * See {@link Platform}.
  * @property {Class} AccessoryDelegate - Abstract superclass for a HomeKit accessory delegate.<br>
  * See {@link AccessoryDelegate}.
  * @property {Class} ServiceDelegate - Abstract superclass for a HomeKit service delegate.<br>
  * See {@link ServiceDelegate}.
  * @property {Class} CharacteristicDelegate - Abstract superclass for a HomeKit characteristic delegate.<br>
  * See {@link CharacteristicDelegate}.
  * @property {Class} Delegate - Abstract superclass for `Platform`,
  * `AccessoryDelegate`, `ServiceDelegate`, and `CharacteristicDelegate`.<br>
  * See {@link Delegate}.
  * @property {Class} hap - HomeKit Accessory Protocol.<br>
  * See {@link hap}.
  * @property {Class} eve - Custom HomeKit services and characteristic used by
  * the [Eve](https://www.evehome.com/en/eve-app) app.<br>
  * See {@link eve}.
  * @property {Class} hap - Custom HomeKit services and characteristics used by
  * [my](https://github.com/ebaauw) plugins.<br>
  * See {@link my}.
  * @property {Class} CommandLineParser - Parser and validator for command-line
  * arguments.<br>
  * See {@link CommandLineParser}.
  * @property {Class} CommandLineTool - Abstract superclass for a
  * command-line tool.<br>
  * See {@link CommandLineTool}.
  * @property {Class} JsonFormatter - JSON formatter.<br>
  * See {@link JsonFormatter}.
  * @property {Class} RestClient - REST API client.<br>
  * See {@link RestClient}.
  * @property {Class} TypeParser - Parser and validator for types.<br>
  * See {@link TypeParser} or the {@tutorial TypeParser} tutorial.
  * @property {Class} UpnpClient - Universal Plug and Play client.<br>
  * See {@link UpnpClient}.
  */
class homebridgeLib {
  static get Platform () { return require('./lib/Platform') }
  static get AccessoryDelegate () { return require('./lib/AccessoryDelegate') }
  static get ServiceDelegate () { return require('./lib/ServiceDelegate') }
  static get CharacteristicDelegate () { return require('./lib/CharacteristicDelegate') }
  static get Delegate () { return require('./lib/Delegate') }

  static get hap () { return require('./lib/hap') }
  static get eve () { return require('./lib/eve') }
  static get my () { return require('./lib/my') }

  static get CommandLineParser () { return require('./lib/CommandLineParser') }
  static get CommandLineTool () { return require('./lib/CommandLineTool') }
  static get JsonFormatter () { return require('./lib/JsonFormatter') }
  static get RestClient () { return require('./lib/RestClient') }
  static get TypeParser () { return require('./lib/TypeParser') }
  static get UpnpClient () { return require('./lib/UpnpClient') }

  // Deprecated
  static get CustomHomeKitTypes () { return require('./lib/CustomHomeKitTypes') }
  static get EveHomeKitTypes () { return require('./lib/EveHomeKitTypes') }
  static get MyHomeKitTypes () { return require('./lib/MyHomeKitTypes') }
  static get OptionParser () { return require('./lib/OptionParser') }
}

module.exports = homebridgeLib
