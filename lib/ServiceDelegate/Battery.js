// homebridge-lib/lib/ServiceDelegate/Battery.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2025 Erik Baauw. All rights reserved.

import { ServiceDelegate } from 'homebridge-lib/ServiceDelegate'

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
  * `statusLowBattery` | `Characteristics.hap.StatusLowBattery` |
  * `lowBatteryThreshold`| `Characteristics.my.LowBatteryThreshold` | Y
  *
  * Depending on the capabilities of the device, the `Battery` service should
  * be configured:
  * - With only `statusLowBattery`, for devices that only report status low
  * battery;
  * - With `statusLowBattery` and `batteryLevel`, for devices that report both
  * battery level and status low battery;
  * - With `statusLowBattery`, `batteryLevel`, and `lowBatteryThreshold`, for
  * devices that only report battery level.
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
    * @param {?integer} [params.batteryLevel=100] - Initial value for
    * `Characteristics.hap.BatteryLevel`.
    * <br>When set to `undefined`, the `BatteryLevel` characteristic is not exposed.
    * @param {?integer} [params.chargingState=NOT_CHARGING] - Initial value for
    * `Characteristics.hap.ChargingState`.
    * <br>When set to `undefined`, the `ChargingState` characteristic is not exposed.
    * @param {integer} [params.statusLowBattery=BATTERY_LEVEL_NORMAL] - Initial
    * value for `Characteristics.hap.StatusLowBattery`.
    * @param {?integer} [params.lowBatteryThreshold=20] - Initial value for
    * low battery threshold.
    * <br>When set to `undefined`, the value of `StatusLowBattery` is not derived
    * from the value of `BatteryLevel`.
    */
  constructor (accessoryDelegate, params = {}) {
    params.name = accessoryDelegate.name + ' Battery'
    params.Service = accessoryDelegate.Services.hap.Battery
    super(accessoryDelegate, params)
    if (params.batteryLevel !== undefined) {
      this.addCharacteristicDelegate({
        key: 'batteryLevel',
        Characteristic: this.Characteristics.hap.BatteryLevel,
        unit: '%',
        value: params.batteryLevel ?? 100
      }).on('didSet', (value) => {
        this.updateStatusLowBattery()
      })
    }
    if (params.chargingState !== undefined) {
      this.addCharacteristicDelegate({
        key: 'chargingState',
        Characteristic: this.Characteristics.hap.ChargingState,
        value: params.chargingState ??
          this.Characteristics.hap.ChargingState.NOT_CHARGING
          // this.Characteristics.hap.ChargingState.NOT_CHARGEABLE
      })
    }
    this.addCharacteristicDelegate({
      key: 'statusLowBattery',
      Characteristic: this.Characteristics.hap.StatusLowBattery,
      value: params.statusLowBattery ??
        this.Characteristics.hap.StatusLowBattery.BATTERY_LEVEL_NORMAL
    })
    if (params.lowBatteryThreshold !== undefined) {
      this.addCharacteristicDelegate({
        key: 'lowBatteryThreshold',
        // Characteristic: this.Characteristics.my.LowBatteryThreshold,
        unit: '%',
        value: params.lowBatteryThreshold ?? 20
      }).on('didSet', (value) => {
        this.updateStatusLowBattery()
      })
    }

    accessoryDelegate.propertyDelegate('name')
      .on('didSet', (value) => {
        this.values.configuredName = value + ' Battery'
      })
  }

  updateStatusLowBattery () {
    this.values.statusLowBattery =
      this.values.batteryLevel <= this.values.lowBatteryThreshold
        ? this.Characteristics.hap.StatusLowBattery.BATTERY_LEVEL_LOW
        : this.Characteristics.hap.StatusLowBattery.BATTERY_LEVEL_NORMAL
  }
}

ServiceDelegate.Battery = Battery
