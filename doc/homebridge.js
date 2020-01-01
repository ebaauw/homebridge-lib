// homebridge-lib/doc/homebridge.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2020 Erik Baauw. All rights reserved.

'use strict'

/* eslint-disable */

// Following "code" is just for generating documentation references for the
// homebridge classes used by homebridge-lib.

/** Homebridge API for dynamic platform plugins
  *
  * From {@link module:homebridge homebridge}.
  *
  * @class
  * @hideconstructor
  * @see https://github.com/nfarina/homebridge/blob/master/lib/api.js
  */
class API {
  /** Emitted every second.
    * @event API#didFinishLaunching
    */

  /** Emitted every second.
    * @event API#shutdown
    */

  /** Registers a platform plugin.
    *
    * @param {!string} pluginName - The name of the plugin's main module.
    * @param {!string} platformName - The name of the platform plugin, as
    * configured in `config.json`.
    * @param {Class} Plugin - The class exposed by the plugin.
    * @param {boolean} [dynamic=false] - Indicates a dynamic platform plugin.
    */
  registerPlatform (pluginName, platformName, Platform, dynamic) {}
}

/** Class for issuing log messages.
  *
  * From {@link module:homebridge homebridge}.
  *
  * Homebridge creates a logger instance for each plugin, and passes it to
  * {@link Plugin#constructor}.
  *
  * @class
  * @hideconstructor
  * @see https://github.com/nfarina/homebridge/blob/master/lib/logger.js
  */
class Logger {}

/** Class for a HomeKit accessory, exposed by a Homebridge dynamic platform plugin.
  *
  * From {@link module:homebridge homebridge}.
  *
  * A HomeKit accessory is a physical device, exposed to HomeKit.
  * It contains one or more logical devices, or HomeKit services
  * (see {@link Accessory}).
  *
  * Plugins don't need to instantiate `PlatformAccessory` themselves.
  * The corresponding {@link AccessoryDelegate} takes care of this.
  *
  * @class
  * @hideconstructor
  * @see https://github.com/KhaosT/HAP-NodeJS/lib/Accessory.js
  */
class PlatformAccessory {}

/** Class for a Homebridge plugin.
  *
  * From {@link module:homebridge homebridge}.
  *
  * Homebridge supports different types of plugins:
  * - Accessory plugins that expose a single HomeKit accessory per plugin
  * instance.
  * The accessory is defined statically, in the plugin configuration.
  * The configuration for accessory plugins is under the `accessories`
  * key in `config.json`;
  * - Platform plugins that expose multiple HomeKit accessories per plugin
  * instance.
  * This allows the plugin to discover devices to be exposed, without the need
  * to define each accessory in the platform configuration.
  * The configuration for platform plugins is under the `platforms` key
  * in `config.json`.
  *
  * There are two types of platform plugins:
  * - Static platform plugins that define their accessories during Homebridge
  * startup.
  * The plugin returns the accessory definitions to Homebridge using a callback
  * function.
  * Homebridge then creates the corresponding {@link Accessory} instances.
  * It will only start its HAP server, after all plugins have called the
  * callback function.
  * - Dynamic platform plugins that use the Homebridge {@link API} to create
  * and remove accessories, after Homebridge has started its HAP server.
  * The plugin creates a {@link PlatformAccessory} instance and calls
  * {@link API#registerPlatformAccessories}
  * Homebridge creates the associated {@link Accessory}
  * Homebridge perists previously exposed accessories, and re-creates them
  * before starting its HAP server.
  *
  * A HomeKit accessory is a physical device, exposed to HomeKit.
  * It contains one or more logical devices, or HomeKit services
  * (see {@link Service}).
  *
  * Plugins don't need to instantiate `Accessory` themselves.
  * The corresponding {@link AccessoryDelegate} takes care of this, through
  * {@link PlatformAccessory}.
  *
  * @class
  * @see https://github.com/KhaosT/HAP-NodeJS/lib/Accessory.js
  */
class Plugin {
  /** Creates an instance of the plugin.
    *
    * @param {Logger} logger - The logger for the plugin.
    * @param {object} platformConfig - The `config.json` entry for the plugin.
    * @param {API} api - The homebridge API.
    */
    constructor (logger, platformConfig, api) {}
}

/** HomeKit support for the impatient.
  *
  * Homebridge by Nick Farina is a NodeJS implementation of a HomeKit
  * accessory, that exposes multiple HomeKit accessories.
  * These bridged accessories are provided by plugins, that communicate with
  * the exposed devices.
  * Homebridge uses HAP-NodeJS to communicate with HomeKit.
  *
  * `homebridge-lib` provides a framework to develop plugins for Homebridge.
  * It handles most of the interaction with homebridge and HAP-NodeJS, so that
  * plugins can focus on the interaction with the exposed devices.
  * Plugins do need to be aware of the following HomeBridge classes:
  *
  * @module homebridge
  * @property {Class} API - Homebridge API, used by dynamic platform
  * plugins to communicate with Homebridge.
  * See {@link API}
  * @property {Class} Logger - Homebridge API, used by dynamic platform
  * plugins to communicate with Homebridge.
  * See {@link Logger}
  * @property {Class} PlatformAccessory - Class for a HomeKit accessory,
  * exposed by a Homebridge platform plugin.
  * See {@link PlatformAccessory}
  * @property {Class} Plugin - Class for a Homebridge plugin.
  * See {@link Plugin}
  * @see https://homebridge.io
  * @see https://github.com/nfarina/homebridge
  */
class homebridge {}

/* eslint-enable */
