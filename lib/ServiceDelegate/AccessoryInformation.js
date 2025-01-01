// homebridge-lib/lib/ServiceDelegate/AccessoryInformation.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2025 Erik Baauw. All rights reserved.

import { ServiceDelegate } from 'homebridge-lib/ServiceDelegate'

/** Class for an _AccessoryInformation_ service delegate.
  *
  * This delegate sets up a `Services.hap.AccessoryInformation` HomeKit service
  * with the following HomeKit characteristics:
  *
  * key            | Characteristic                         | isOptional
  * -------------- | -------------------------------------- | ----------
  * `name`         | `Characteristics.hap.Name`             |
  * `id`           | `Characteristics.hap.SerialNumber`     |
  * `manufacturer` | `Characteristics.hap.Manufacturer`     |
  * `model`        | `Characteristics.hap.Model`            |
  * `firmware`     | `Characteristics.hap.FirmwareRevision` |
  * `hardware`     | `Characteristics.hap.HardwareRevision` | Y
  * `software`     | `Characteristics.hap.SoftwareRevision` | Y
  * @extends ServiceDelegate
  * @memberof ServiceDelegate
  */
class AccessoryInformation extends ServiceDelegate {
  /** Create a new instance of an _AccessoryInformation_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _AccessoryInformation_ HomeKit service.
    * @param {!string} params.name - Initial value for
    * `Characteristics.hap.Name`. Also used to prefix log and error messages.
    * @param {!string} params.id - Initial value for
    * `Characteristics.hap.SerialNumber`.
    * @param {!string} params.manufacturer - Initial value for
    * `Characteristics.hap.Manufacturer`.
    * @param {!string} params.model - Initial value for
    * `Characteristics.hap.Model`.
    * @param {!string} params.firmware - Initial value for
    * `Characteristics.hap.FirmwareRevision`.
    * @param {?string} params.hardware - Initial value for
    * `Characteristics.hap.HardwareRevision`.
    * @param {?string} params.software - Initial value for
    * `Characteristics.hap.SoftwareRevision`.
    */
  constructor (accessoryDelegate, params = {}) {
    params.name = accessoryDelegate.name
    params.Service = accessoryDelegate.Services.hap.AccessoryInformation
    super(accessoryDelegate, params)
    this.addCharacteristicDelegate({
      key: 'id',
      Characteristic: this.Characteristics.hap.SerialNumber,
      value: params.id
    })
    this.addCharacteristicDelegate({
      key: 'identify',
      Characteristic: this.Characteristics.hap.Identify
    })
    this.addCharacteristicDelegate({
      key: 'manufacturer',
      Characteristic: this.Characteristics.hap.Manufacturer,
      value: params.manufacturer
    })
    this.addCharacteristicDelegate({
      key: 'model',
      Characteristic: this.Characteristics.hap.Model,
      value: params.model
    })
    this.addCharacteristicDelegate({
      key: 'firmware',
      Characteristic: this.Characteristics.hap.FirmwareRevision,
      value: params.firmware
    })
    if (params.hardware != null || this._context.hardware != null) {
      this.addCharacteristicDelegate({
        key: 'hardware',
        Characteristic: this.Characteristics.hap.HardwareRevision,
        value: params.hardware
      })
    }
    if (params.software != null || this._context.software != null) {
      this.addCharacteristicDelegate({
        key: 'software',
        Characteristic: this.Characteristics.hap.SoftwareRevision,
        value: params.software
      })
    }

    accessoryDelegate.propertyDelegate('name')
      .on('didSet', (value) => {
        this.values.configuredName = value
      })
  }

  addCharacteristicDelegate (params = {}) {
    const delegate = super.addCharacteristicDelegate(params)
    Object.defineProperty(this.accessoryDelegate.values, params.key, {
      configurable: true, // make sure we can delete it again
      writeable: true,
      get () { return delegate.value },
      set (value) { delegate.value = value }
    })
    return delegate
  }

  removeCharacteristicDelegate (key) {
    delete this.accessoryDelegate.values[key]
    super.removeCharacteristicDelegate(key)
  }
}

ServiceDelegate.AccessoryInformation = AccessoryInformation
