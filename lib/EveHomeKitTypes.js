// homebridge-lib/lib/EveHomeKitTypes.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2019 Erik Baauw. All rights reserved.
//
// Custom Services and Characteristics as used by Elgato's Eve.
// See: https://gist.github.com/simont77/3f4d4330fa55b83f8ca96388d9004e7d

const homebridgeLib = require('../index')

let hap

function uuid (id) {
  if (typeof id !== 'string' || id.length !== 3) {
    throw new TypeError(`${id}: illegal id`)
  }
  // UUID range used by Elgato
  return `E863F${id}-079E-48FF-8F27-9C2605A29F52`
}

/** Collection of custom HomeKit Services and Characteristic used by Eve.
  * @extends CustomHomeKitTypes
  */
class EveHomeKitTypes extends homebridgeLib.CustomHomeKitTypes {
  /** Create custom HomeKit Services and Characteristics used by Eve.
    * @param {object} homebridge - API object from homebridge
    */
  constructor (homebridge) {
    super(homebridge)
    hap = homebridge.hap

    // Used in Service.Outlet for Eve Energy
    this.createCharacteristic('Voltage', uuid('10A'), {
      format: this.formats.FLOAT,
      unit: 'V',
      perms: [this.perms.READ, this.perms.NOTIFY]
    })

    // Used for Eve Room.
    this.createCharacteristic('AirParticulateDensity', uuid('10B'), {
      format: this.formats.FLOAT,
      unit: 'ppm',
      maxValue: 5000,
      minValue: 0,
      minStep: 1,
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Air Particulate Density')

    // Used in Service.Outlet for Eve Enegergy
    this.createCharacteristic('TotalConsumption', uuid('10C'), {
      format: this.formats.FLOAT,
      unit: 'kWh',
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Total Consumption')

    // Used in Service.Outlet for Eve Enegergy
    this.createCharacteristic('CurrentConsumption', uuid('10D'), {
      format: this.formats.FLOAT,
      unit: 'W',
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Current Consumption')

    // Used in Service.Weather for Eve Weather
    // and in Service.AirPressure for Eve Degree
    this.createCharacteristic('AirPressure', uuid('10F'), {
      format: this.formats.UINT16,
      unit: 'hPa',
      maxValue: 1100,
      minValue: 700,
      minStep: 1,
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Air Pressure')

    // Used in Service.History
    this.createCharacteristic('ResetTotal', uuid('112'), {
      format: this.formats.UINT32,
      unit: this.units.seconds, // since 2001/01/01
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    }, 'Reset Total')

    // Used in Service.History
    this.createCharacteristic('HistoryStatus', uuid('116'), {
      format: this.formats.DATA,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.HIDDEN]
    }, 'History Status')

    // Used in Service.History
    this.createCharacteristic('HistoryEntries', uuid('117'), {
      format: this.formats.DATA,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.HIDDEN]
    }, 'History Entries')

    // Used in Service.ContactSensor for Eve Door
    this.createCharacteristic('OpenDuration', uuid('118'), {
      format: this.formats.UINT32,
      unit: this.units.SECONDS, // since last reset
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    }, 'Open Duration')

    // Used in Service.ContactSensor for Eve Door
    this.createCharacteristic('ClosedDuration', uuid('119'), {
      format: this.formats.UINT32,
      unit: this.units.SECONDS, // since last reset
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    }, 'Closed Duration')

    // Used in Service.ContactSensor for Eve Door
    // and in Service.MotionSensor for Eve Motion
    this.createCharacteristic('LastActivation', uuid('11A'), {
      format: this.formats.UINT32,
      unit: this.units.SECONDS, // since last reset
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Last Activation')

    // Used in Service.History
    this.createCharacteristic('HistoryRequest', uuid('11C'), {
      format: this.formats.DATA,
      perms: [this.perms.WRITE, this.perms.HIDDEN]
    }, 'History Request')

    // Used in Service.MotionSensor for Eve Motion
    this.createCharacteristic('Sensitivity', uuid('120'), {
      format: this.formats.UINT8,
      minValue: 0,
      maxValue: 7,
      validValues: [0, 4, 7],
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    })
    this.Characteristic.Sensitivity.HIGH = 0
    this.Characteristic.Sensitivity.MEDIUM = 4
    this.Characteristic.Sensitivity.LOW = 7

    // Used in Service.History
    this.createCharacteristic('SetTime', uuid('121'), {
      format: this.formats.DATA,
      perms: [this.perms.WRITE, this.perms.HIDDEN]
    })

    // Used in Service.Outlet for Eve Enegergy
    this.createCharacteristic('ElectricCurrent', uuid('126'), {
      format: this.formats.FLOAT,
      unit: 'A',
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Electric Current')

    // Used in Service.ContactSensor for Eve Door
    this.createCharacteristic('TimesOpened', uuid('129'), {
      format: this.formats.UINT32,
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Times Opened')

    // Used in Service.Thermostat for Eve Thermo
    this.createCharacteristic('ProgramCommand', uuid('12C'), {
      format: this.formats.DATA,
      perms: [this.perms.WRITE]
    }, 'Program Command')

    // Used in Service.MotionSensor for Eve Motion
    this.createCharacteristic('Duration', uuid('12D'), {
      format: this.formats.UINT16,
      unit: this.units.SECONDS,
      minValue: 5,
      maxValue: 15 * 3600,
      validValues: [
        5, 10, 20, 30,
        1 * 60, 2 * 60, 3 * 60, 5 * 60, 10 * 60, 20 * 60, 30 * 60,
        1 * 3600, 2 * 3600, 3 * 3600, 5 * 3600, 10 * 3600, 12 * 3600, 15 * 3600
      ],
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    })

    // Used in Service.Thermostat for Eve Thermo
    this.createCharacteristic('ValvePosition', uuid('12E'), {
      format: this.formats.UINT8,
      unit: this.units.PERCENTAGE,
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Valve Position')

    // Used in Service.Thermostat for Eve Thermo
    this.createCharacteristic('ProgramData', uuid('12F'), {
      format: this.formats.DATA,
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Program Data')

    // Used in Service.AirPressure for Eve Degree, presumably for units
    this.createCharacteristic('Elevation', uuid('130'), {
      format: this.formats.INT16,
      unit: 'm',
      minValue: -430,
      maxValue: 8850,
      minStep: 10,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    })

    // Allow for negative temperatures.
    this.createCharacteristic(
      'CurrentTemperature', hap.Characteristic.CurrentTemperature.UUID, {
        format: this.formats.FLOAT,
        unit: this.units.CELSIUS,
        maxValue: 100,
        minValue: -40,
        minStep: 0.1,
        perms: [this.perms.READ, this.perms.NOTIFY]
      }, 'Current Temperature'
    )

    // ===== Weather Station ===================================================

    this.createCharacteristic(
      'WeatherCondition', 'CD65A9AB-85AD-494A-B2BD-2F380084134D', {
        format: this.formats.STRING,
        perms: [this.perms.READ, this.perms.NOTIFY]
      }, 'Condition'
    )

    this.createCharacteristic(
      'Rain1h', '10C88F40-7EC4-478C-8D5A-BD0C3CCE14B7', {
        format: this.formats.UINT16,
        unit: 'mm',
        maxValue: 1000,
        minValue: 0,
        minStep: 1,
        perms: [this.perms.READ, this.perms.NOTIFY]
      }, 'Rain Last Hour'
    )

    this.createCharacteristic(
      'Rain24h', 'CCC04890-565B-4376-B39A-3113341D9E0F', {
        format: this.formats.UINT16,
        unit: 'mm',
        maxValue: 1000,
        minValue: 0,
        minStep: 1,
        perms: [this.perms.READ, this.perms.NOTIFY]
      }, 'Rain Today'
    )

    this.createCharacteristic(
      'UVIndex', '05BA0FE0-B848-4226-906D-5B64272E05CE', {
        format: this.formats.UINT8,
        maxValue: 10,
        minValue: 0,
        minStep: 1,
        perms: [this.perms.READ, this.perms.NOTIFY]
      }, 'UV Index'
    )

    this.createCharacteristic(
      'Visibility', 'D24ECC1E-6FAD-4FB5-8137-5AF88BD5E857', {
        format: this.formats.UINT8,
        unit: 'km',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [this.perms.READ, this.perms.NOTIFY]
      }
    )

    this.createCharacteristic(
      'WindDirection', '46F1284C-1912-421B-82F5-EB75008B167E', {
        format: this.formats.STRING,
        perms: [this.perms.READ, this.perms.NOTIFY]
      }, 'Wind Direction'
    )

    this.createCharacteristic(
      'WindSpeed', '49C8AE5A-A3A5-41AB-BF1F-12D5654F9F41', {
        format: this.formats.FLOAT,
        unit: 'km/h',
        maxValue: 100,
        minValue: 0,
        minStep: 0.1,
        perms: [this.perms.READ, this.perms.NOTIFY]
      }, 'Wind Speed'
    )

    // ===== Services ==========================================================

    // Used in Eve Weather
    this.createService('Weather', uuid('001'), [
      this.Characteristic.CurrentTemperature,
      hap.Characteristic.CurrentRelativeHumidity,
      this.Characteristic.AirPressure
    ])

    this.createService('History', uuid('007'), [
      // this.Characteristic.Char11E,
      this.Characteristic.ResetTotal,
      this.Characteristic.HistoryRequest,
      this.Characteristic.SetTime,
      this.Characteristic.HistoryStatus,
      this.Characteristic.HistoryEntries
      // this.Characteristic.Char11D,
      // this.Characteristic.Char131
    ])

    // Used in Eve Degree
    this.createService('AirPressureSensor', uuid('00A'), [
      this.Characteristic.AirPressure,
      this.Characteristic.Elevation
    ])

    // Used in Eve Door
    this.createService('ContactSensor', hap.Service.ContactSensor.UUID, [
      hap.Characteristic.ContactSensorState,
      this.Characteristic.TimesOpened,
      this.Characteristic.OpenDuration,
      this.Characteristic.ClosedDuration,
      this.Characteristic.LastActivation
    ])

    // Used in Eve Motion
    this.createService('MotionSensor', hap.Service.MotionSensor.UUID, [
      hap.Characteristic.MotionDetected,
      this.Characteristic.Sensitivity,
      this.Characteristic.Duration,
      this.Characteristic.LastActivation
    ])

    // Used in Eve Energy
    this.createService('Outlet', hap.Service.Outlet.UUID, [
      hap.Characteristic.On,
      hap.Characteristic.InUse,
      this.Characteristic.Voltage,
      this.Characteristic.ElectricCurrent,
      this.Characteristic.CurrentConsumption,
      this.Characteristic.TotalConsumption
    ])

    // Used in Eve Degree
    this.createService(
      'TemperatureSensor', hap.Service.TemperatureSensor.UUID, [
        this.Characteristic.CurrentTemperature,
        hap.Characteristic.TemperatureDisplayUnits
      ]
    )

    // Used in Eve Thermo
    this.createService('Thermostat', hap.Service.Thermostat.UUID, [
      hap.Characteristic.CurrentHeatingCoolingState,
      hap.Characteristic.TargetHeatingCoolingState,
      this.Characteristic.CurrentTemperature,
      hap.Characteristic.TargetTemperature,
      hap.Characteristic.TemperatureDisplayUnits,
      this.Characteristic.ValvePosition
    ], [
      this.Characteristic.ProgramCommand,
      this.Characteristic.ProgramData
    ])
  }
}

module.exports = EveHomeKitTypes
