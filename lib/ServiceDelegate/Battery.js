// homebridge-lib/lib/ServiceDelegate/Battery.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2022 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../../index')

const { ServiceDelegate } = homebridgeLib

/** Class for a _Battery_ service delegate.
  *
  * This delegate sets up a `Services.hap.Battery` HomeKit service
  * with the following HomeKit characteristics:
  *
  * key                | Characteristic                         | isOptional
  * ------------------ | -------------------------------------- | ----------
  * `name`             | `Characteristics.hap.Name`             |
  * `batteryLevel`     | `Characteristics.hap.BatteryLevel`     | Y
  * `chargingState`    | `Characteristics.hap.ChargingState`    | Y
  * `statusLowBattery` | `Characteristics.hap.StatusLowBattery` | Y
  * `lowBatteryThreshold`| `Characteristics.my.LowBatteryThreshold` | Y
  *
  * @extends ServiceDelegate
  * @memberof ServiceDelegate
  */
class Battery extends ServiceDelegate {
  /** Create a new instance of an _Battery_ service delegate.
    * @param {!AccessoryDelegate} accessoryDelegate - The delegate of the
    * corresponding HomeKit accessory.
    * @param {object} params - The parameters for the
    * _AccessoryInformation_ HomeKit service.
    * @param {integer} [params.batteryLevel=100] - Initial value for
    * `Characteristics.hap.BatteryLevel`.
    * @param {integer} [params.chargingState=NOT_CHARGEABLE] - Initial value for
    * `Characteristics.hap.ChargingState`.
    * @param {integer} [params.statusLowBattery=BATTERY_LEVEL_NORMAL] - Initial
    * value for `Characteristics.hap.StatusLowBattery`.
    * @param {integer} [params.lowBatteryThreshold=20] - Initial value for
    * low battery threshold.
    */
  constructor (accessoryDelegate, params = {}) {
    params.name = accessoryDelegate.name + ' Battery'
    params.Service = accessoryDelegate.Services.hap.BatteryService
    super(accessoryDelegate, params)
    this.addCharacteristicDelegate({
      key: 'batteryLevel',
      Characteristic: this.Characteristics.hap.BatteryLevel,
      unit: '%',
      value: params.batteryLevel != null ? params.batteryLevel : 100
    }).on('didSet', (value) => {
      this.updateStatusLowBattery()
    })
    this.addCharacteristicDelegate({
      key: 'chargingState',
      Characteristic: this.Characteristics.hap.ChargingState,
      value: params.chargingState != null
        ? params.chargingState
        : this.Characteristics.hap.ChargingState.NOT_CHARGEABLE
    })
    this.addCharacteristicDelegate({
      key: 'statusLowBattery',
      Characteristic: this.Characteristics.hap.StatusLowBattery,
      value: params.statusLowBattery != null
        ? params.statusLowBattery
        : this.Characteristics.hap.StatusLowBattery.BATTERY_LEVEL_NORMAL
    })
    this.addCharacteristicDelegate({
      key: 'lowBatteryThreshold',
      Characteristic: this.Characteristics.my.LowBatteryThreshold,
      unit: '%',
      value: params.lowBatteryThreshold != null ? params.lowBatteryThreshold : 20
    }).on('didSet', (value) => {
      this.updateStatusLowBattery()
    })
  }

  updateStatusLowBattery () {
    this.values.statusLowBattery =
      this.values.batteryLevel <= this.values.lowBatteryThreshold
        ? this.Characteristics.hap.StatusLowBattery.BATTERY_LEVEL_LOW
        : this.Characteristics.hap.StatusLowBattery.BATTERY_LEVEL_NORMAL
  }
}

module.exports = Battery
