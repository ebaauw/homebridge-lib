// homebridge-lib/lib/ServiceDelegate/ServiceLabel.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2022 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../../index')

const { ServiceDelegate } = homebridgeLib

/** Class for a _ServiceLabel_ service delegate.
  *
  * This delegate sets up a `Services.hap.ServiceLabel` HomeKit service
  * with the following HomeKit characteristics:
  *
  * key            | Characteristic                              | isOptional
  * -------------- | ------------------------------------------- | ----------
  * `name`         | `Characteristics.hap.Name`                  |
  * `namespace`    | `Characteristics.hap.ServiceLabelNamespace` |
  * @extends ServiceDelegate
  * @memberof ServiceDelegate
  */
class ServiceLabel extends ServiceDelegate {
  /** Create a new instance of an _ServiceLabel_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {!object} params - The parameters for the
    * _AccessoryInformation_ HomeKit service.
    * @param {!string} params.name - Initial value for
    * `Characteristics.hap.Name`. Also used to prefix log and error messages.
    * @param {!string} params.namespace - Initial value for
    * `Characteristics.hap.ServiceLabelNamespace`.
    */
  constructor (accessoryDelegate, params = {}) {
    params.name = accessoryDelegate.name
    params.Service = accessoryDelegate.Services.hap.ServiceLabel
    super(accessoryDelegate, params)
    this.addCharacteristicDelegate({
      key: 'namespace',
      Characteristic: this.Characteristics.hap.ServiceLabelNamespace,
      value: params.namespace
    })
  }
}

module.exports = ServiceLabel