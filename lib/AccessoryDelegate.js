// homebridge-lib/lib/AccessoryDelegate.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2019 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

const startsWithUuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}/

/** Abstract superclass for a HomeKit accessory delegate.
  *
  * @abstract
  * @extends Delegate
  */
class AccessoryDelegate extends homebridgeLib.Delegate {
  /** Create a new instance of a HomeKit accessory delegate.
    *
    * When the corresponding HomeKit accessory was restored from persistent
    * storage, it is linked to the delegate. Otherwise a new accessory
    * will be created, using the values from `params`.
    * @param {!Platform} platform - Reference to the corresponding platform
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
    this._serviceDelegates = {}
    this._AccessoryInformationDelegate =
      new homebridgeLib.ServiceDelegate.AccessoryInformation(this, params)

    // Configure PlatformAccessory.
    this._accessory.on('identify', this._identify.bind(this))

    this.once('initialised', () => {
      const services = []
      for (const service of this._accessory.services) {
        const key = service.UUID +
          (service.subtype == null ? '' : '.' + service.subtype)
        if (this._serviceDelegates[key] == null) {
          services.push(service)
        }
      }
      for (const service of services) {
        this.debug('remove stale service %s', service.displayName)
        this._accessory.removeService(service)
      }
      for (const key in this._context) {
        if (this._serviceDelegates[key] == null && startsWithUuid.test(key)) {
          this.debug('remove stale context %s', key)
          delete this._context[key]
        }
      }
    })
  }

  // Remove associated accessory from platform
  destroy () {
    this.removeAllListeners('heartbeat')
    this.removeAllListeners('shutdown')
    this._platform._removeAccessory(this._accessory)
  }

  _linkServiceDelegate (serviceDelegate) {
    const key = serviceDelegate._key
    // this.debug('link service %s', key)
    this._serviceDelegates[key] = serviceDelegate
    return serviceDelegate
  }

  _unlinkServiceDelegate (serviceDelegate) {
    const key = serviceDelegate._key
    // this.debug('unlink service %s', key)
    delete this._serviceDelegates[key]
    delete this._context[key]
  }

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

  get alive () {
    return this._alive
  }

  setAlive () {
    this._alive = true
  }

  /** Plugin-specific context to be persisted across Homebridge restarts.
    *
    * After restart, this object is passed back to the plugin through the
    * {@link Platform#event:accessoryRestored accessoryRestored} event.
    * The plugin should store enough information to re-create the accessory
    * delegate, after Homebridge has restored the accessory.
    * @type {object}
    */
  get context () {
    return this._context.context
  }

  // Called by homebridge when Identify is selected.
  _identify (paired, callback) {
    this.log('identify')
    this.emit('identify')
    this.debug('context: %j', this._context)
    callback()
  }
}

module.exports = AccessoryDelegate
