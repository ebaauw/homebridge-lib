// homebridge-lib/lib/LibAccessory.js
//
// Library for Homebridge plugins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = {
  LibObject: require('./LibObject'),
  LibService: require('./LibService')
}

/**
 * Abstract superclass for a HomeKit accessory delegate.
 *
 * @abstract
 * @extends LibObject
 */
class LibAccessory extends homebridgeLib.LibObject {
  /**
   * Create a new instance of a HomeKit accessory delegate.
   *
   * When the corresponding HomeKit accessory was restored from persistent
   * storage, it is linked to the delegate. Otherwise a new accessory
   * will be created, using the values from `params`.
   * @param {!LibPlatform} platform - Reference to the corresponding platform
   * plugin instance.
   * @param {!object} params - Properties of the HomeKit accessory.
   * @param {!string} params.id - The unique ID of the accessory, used to
   * derive the HomeKit accessory UUID.<br>
   * Must be unchangeable, preferably a serial number or mac address.
   * @param {!string} params.name - The accessory name.<br>
   * Also used to prefix log and error messages.
   * @param {?string} params.category - The accessory category.
   * @param {!string} params.manufacturer - The accessory manufacturer.
   * @param {!string} params.model - The accessory model.
   * @param {!string} params.firmware - The accessory firmware revision.
   * @param {?string} params.hardware - The accessory hardware revision.
   * @param {?string} params.software - The accessory software revision.
   */
  constructor (platform, params = {}) {
    if (params.name == null) {
      throw new SyntaxError('params.name: missing')
    }
    super(platform, params.name)
    if (params.id == null || typeof params.id !== 'string') {
      throw new TypeError('params.id: not a string')
    }
    if (params.id === '') {
      throw new RangeError('params.id: invalid id')
    }

    // Link or create associated PlatformAccessory.
    this._accessory = this._platform._getAccessory(this, params)
    this._context = this._accessory.context

    // Create delegate for AccessoryInformation service.
    this._AccessoryInformationDelegate =
      new homebridgeLib.LibService.AccessoryInformation(this, params)

    // Configure PlatformAccessory.
    this._accessory.on('identify', this._identify.bind(this))
  }

  // Remove associated accessory from platform
  remove () {
    this._platform._removeAccessory(this._accessory)
  }
  // ===== Public properties ===================================================

  get name () {
    return super.name
  }
  set name (name) {
    super.name = name
    if (this._accessory != null) {
      this._accessory.displayName = name
    }
    if (this._AccessoryInformationDelegate != null) {
      this._AccessoryInformationDelegate.values.name = name
    }
  }

  /**
   * Plugin-specific context to be persisted across Homebridge restarts.
   *
   * After restart, this object is passed back to the plugin through the
   * {@link LibPlatform#event:accessoryRestored accessoryRestored} event.
   * The plugin should store enough information to re-create the accessory
   * delegate, after Homebridge has restored the accessory.
   * @type {object}
   */
  get context () {
    return this._context.context
  }

  // ===== Private methods =====================================================

  // Called by homebridge when Identify is selected.
  _identify (paired, callback) {
    this.log('identify')
    this.emit('identify')
    this.debug('context: %j', this._context)
    callback()
  }
}

module.exports = LibAccessory
