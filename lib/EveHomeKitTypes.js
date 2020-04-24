// homebridge-lib/lib/EveHomeKitTypes.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2020 Erik Baauw. All rights reserved.

const homebridgeLib = require('../index')

function uuid (id) {
  if (typeof id !== 'string' || id.length !== 3) {
    throw new TypeError(`${id}: illegal id`)
  }
  // UUID range used by Eve
  return `E863F${id}-079E-48FF-8F27-9C2605A29F52`
}

/** Custom HomeKit Services and Characteristic used by
  * [Eve](https://www.evehome.com/en) accessories and by the
  * [Eve app](https://www.evehome.com/en/eve-app).
  *
  * For more info, see the
  * [Wiki](https://github.com/simont77/fakegato-history/wiki/Services-and-characteristics-for-Elgato-Eve-devices)
  * of Simone Tisa's
  * [`fakegato-history`](https://github.com/simont77/fakegato-history)
  * repository or the related
  * [Gist](https://gist.github.com/simont77/3f4d4330fa55b83f8ca96388d9004e7d).
  * @extends CustomHomeKitTypes
  */
class EveHomeKitTypes extends homebridgeLib.CustomHomeKitTypes {
  /** Start time for Eve history (2001-01-01T00:00:00Z).
    * @type {integer}
    * @readonly
    */
  static get epoch () { return new Date('2001-01-01T00:00:00Z') / 1000 }

  /** Create custom HomeKit Services and Characteristics used by Eve.
    * @param {object} homebridge - API object from homebridge
    */
  constructor (homebridge) {
    super(homebridge)

    /** @member EveHomeKitTypes#Characteristics
      * @property {Class} AirParticulateDensity - Density (in ppm) of air particulates.
      * <br>Used by: Eve Room.
      * @property {Class} AirPressure - Air pressure (in hPa).
      * <br>Used by: Eve Weather.
      * @property {Class} ClosedDuration - Time in seconds that door has been open.
      * <br>Used by: Eve Door.
      * @property {Class} CurrentConsumption - Current electric consumption (in W).
      * <br>Used by: Eve Energy.
      * @property {Class} CurrentTemperature - Current temperature (in °C).
      * <br>Used by: Eve Room, Eve Thermo, Eve Weather.
      * @property {Class} Duration - Duration (in s) that Motion sensor reports motion.
      * <br>Used by: Eve Motion (in _Accessory_ screen in Eve app).
      * @property {Class} ElectricCurrent - Electric current (in A).
      * <br>Used by: Eve Energy.
      * @property {Class} Elevation - Elevation (in m) to calibrate air pressure.
      * <br>Used by: Eve Weather (in _Accessory_ screen in Eve app).
      * @property {Class} HistoryEntries - Used for displaying history.
      * @property {Class} HistoryRequest - Used for displaying history.
      * @property {Class} HistoryStatus - Used for displaying history.
      * @property {Class} LastActivation - Time (in seconds since epoch) of last event.
      * <br>Used by: Eve Door, Eve Motion.
      * @property {Class} OpenDuration - Duration (in seconds) that door has been closed.
      * <br>Used by: Eve Door.
      * @property {Class} ProgramCommand - Used for programming schedules - details unknown.
      * <br>Used by: Eve Thermo.
      * @property {Class} ProgramData - Used for programming schedules - details unknown.
      * <br>Used by: Eve Thermo.
      * @property {Class} Rain1h - Rain (in mm) during past hour.
      * @property {Class} Rain24h - Rain (in mm) during past 24 hours.
      * @property {Class} ResetTotal - Time (as seconds since epoch) of last reset.
      * @property {Class} Sensitivity - Motion sensor sensitivity.
      * <br>Used by: Eve Motion.
      * <br>Shown by Eve app in _Accessory_ screen.
      * @property {Class} SetTime - Used for displaying history.
      * @property {Class} TimesOpened - Number of times the door was opened.
      * <br>Used by: Eve Door.
      * @property {Class} TotalConsumption - Life-time electric consumption (in KWh).
      * <br>Used by: Eve Energy.
      * @property {Class} UVIndex - UV index.
      * @property {Class} ValvePosition - Current radiator valve position (in %).
      * <br>Used by: Eve Thermo (as Mode history).
      * @property {Class} Visibility - Visibility (in km).
      * @property {Class} Voltage - Electric voltage (in V).
      * <br>Used by: Eve Energy.
      * @property {Class} WeatherCondition - Weather condition (as text).
      * @property {Class} WindDirection - Wind direction (as text).
      * @property {Class} WindSpeed - Wind speed (in km/h).
      */

    // Used in Service.Outlet for Eve Energy
    this.createCharacteristicClass('Voltage', uuid('10A'), {
      format: this.Formats.FLOAT,
      unit: 'V',
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    })

    // Used for Eve Room.
    this.createCharacteristicClass('AirParticulateDensity', uuid('10B'), {
      format: this.Formats.FLOAT,
      unit: 'ppm',
      maxValue: 5000,
      minValue: 0,
      minStep: 1,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Air Particulate Density')

    // Used in Service.Outlet for Eve Enegergy
    this.createCharacteristicClass('TotalConsumption', uuid('10C'), {
      format: this.Formats.FLOAT,
      unit: 'kWh',
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Total Consumption')

    // Used in Service.Outlet for Eve Enegergy
    this.createCharacteristicClass('CurrentConsumption', uuid('10D'), {
      format: this.Formats.FLOAT,
      unit: 'W',
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Current Consumption')

    // Used in Service.Weather for Eve Weather
    // and in Service.AirPressure for Eve Degree
    this.createCharacteristicClass('AirPressure', uuid('10F'), {
      format: this.Formats.UINT16,
      unit: 'hPa',
      maxValue: 1100,
      minValue: 700,
      minStep: 1,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Air Pressure')

    // Used in Service.History
    this.createCharacteristicClass('ResetTotal', uuid('112'), {
      format: this.Formats.UINT32,
      unit: this.Units.seconds, // since 2001/01/01
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    }, 'Reset Total')

    // Used in Service.History
    this.createCharacteristicClass('HistoryStatus', uuid('116'), {
      format: this.Formats.DATA,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.HIDDEN]
    }, 'History Status')

    // Used in Service.History
    this.createCharacteristicClass('HistoryEntries', uuid('117'), {
      format: this.Formats.DATA,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.HIDDEN]
    }, 'History Entries')

    // Used in Service.ContactSensor for Eve Door
    this.createCharacteristicClass('OpenDuration', uuid('118'), {
      format: this.Formats.UINT32,
      unit: this.Units.SECONDS, // since last reset
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    }, 'Open Duration')

    // Used in Service.ContactSensor for Eve Door
    this.createCharacteristicClass('ClosedDuration', uuid('119'), {
      format: this.Formats.UINT32,
      unit: this.Units.SECONDS, // since last reset
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    }, 'Closed Duration')

    // Used in Service.ContactSensor for Eve Door
    // and in Service.MotionSensor for Eve Motion
    this.createCharacteristicClass('LastActivation', uuid('11A'), {
      format: this.Formats.UINT32,
      unit: this.Units.SECONDS, // since last reset
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Last Activation')

    // Used in Service.History
    this.createCharacteristicClass('HistoryRequest', uuid('11C'), {
      format: this.Formats.DATA,
      perms: [this.Perms.WRITE, this.Perms.HIDDEN]
    }, 'History Request')

    // Used in Service.MotionSensor for Eve Motion
    this.createCharacteristicClass('Sensitivity', uuid('120'), {
      format: this.Formats.UINT8,
      minValue: 0,
      maxValue: 7,
      validValues: [0, 4, 7],
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })
    this.Characteristics.Sensitivity.HIGH = 0
    this.Characteristics.Sensitivity.MEDIUM = 4
    this.Characteristics.Sensitivity.LOW = 7

    // Used in Service.History
    this.createCharacteristicClass('SetTime', uuid('121'), {
      format: this.Formats.DATA,
      perms: [this.Perms.WRITE, this.Perms.HIDDEN]
    })

    // Used in Service.Outlet for Eve Enegergy
    this.createCharacteristicClass('ElectricCurrent', uuid('126'), {
      format: this.Formats.FLOAT,
      unit: 'A',
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Electric Current')

    // Used in Service.ContactSensor for Eve Door
    this.createCharacteristicClass('TimesOpened', uuid('129'), {
      format: this.Formats.UINT32,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Times Opened')

    // Used in Service.Thermostat for Eve Thermo
    this.createCharacteristicClass('ProgramCommand', uuid('12C'), {
      format: this.Formats.DATA,
      perms: [this.Perms.WRITE]
    }, 'Program Command')

    // Used in Service.MotionSensor for Eve Motion
    this.createCharacteristicClass('Duration', uuid('12D'), {
      format: this.Formats.UINT16,
      unit: this.Units.SECONDS,
      minValue: 5,
      maxValue: 15 * 3600,
      validValues: [
        5, 10, 20, 30,
        1 * 60, 2 * 60, 3 * 60, 5 * 60, 10 * 60, 20 * 60, 30 * 60,
        1 * 3600, 2 * 3600, 3 * 3600, 5 * 3600, 10 * 3600, 12 * 3600, 15 * 3600
      ],
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })

    // Used in Service.Thermostat for Eve Thermo
    this.createCharacteristicClass('ValvePosition', uuid('12E'), {
      format: this.Formats.UINT8,
      unit: this.Units.PERCENTAGE,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Valve Position')

    // Used in Service.Thermostat for Eve Thermo
    this.createCharacteristicClass('ProgramData', uuid('12F'), {
      format: this.Formats.DATA,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Program Data')

    // Used in Service.AirPressure for Eve Degree, presumably for units
    this.createCharacteristicClass('Elevation', uuid('130'), {
      format: this.Formats.INT16,
      unit: 'm',
      minValue: -430,
      maxValue: 8850,
      minStep: 10,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })

    // Allow for negative temperatures.
    this.createCharacteristicClass(
      'CurrentTemperature', this.hapCharacteristics.CurrentTemperature.UUID, {
        format: this.Formats.FLOAT,
        unit: this.Units.CELSIUS,
        maxValue: 100,
        minValue: -40,
        minStep: 0.1,
        perms: [this.Perms.READ, this.Perms.NOTIFY]
      }, 'Current Temperature'
    )

    // ===== Weather Station ===================================================

    this.createCharacteristicClass(
      'WeatherCondition', 'CD65A9AB-85AD-494A-B2BD-2F380084134D', {
        format: this.Formats.STRING,
        perms: [this.Perms.READ, this.Perms.NOTIFY]
      }, 'Condition'
    )

    this.createCharacteristicClass(
      'Rain1h', '10C88F40-7EC4-478C-8D5A-BD0C3CCE14B7', {
        format: this.Formats.UINT16,
        unit: 'mm',
        maxValue: 1000,
        minValue: 0,
        minStep: 1,
        perms: [this.Perms.READ, this.Perms.NOTIFY]
      }, 'Rain Last Hour'
    )

    this.createCharacteristicClass(
      'Rain24h', 'CCC04890-565B-4376-B39A-3113341D9E0F', {
        format: this.Formats.UINT16,
        unit: 'mm',
        maxValue: 1000,
        minValue: 0,
        minStep: 1,
        perms: [this.Perms.READ, this.Perms.NOTIFY]
      }, 'Rain Today'
    )

    this.createCharacteristicClass(
      'UVIndex', '05BA0FE0-B848-4226-906D-5B64272E05CE', {
        format: this.Formats.UINT8,
        maxValue: 10,
        minValue: 0,
        minStep: 1,
        perms: [this.Perms.READ, this.Perms.NOTIFY]
      }, 'UV Index'
    )

    this.createCharacteristicClass(
      'Visibility', 'D24ECC1E-6FAD-4FB5-8137-5AF88BD5E857', {
        format: this.Formats.UINT8,
        unit: 'km',
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [this.Perms.READ, this.Perms.NOTIFY]
      }
    )

    this.createCharacteristicClass(
      'WindDirection', '46F1284C-1912-421B-82F5-EB75008B167E', {
        format: this.Formats.STRING,
        perms: [this.Perms.READ, this.Perms.NOTIFY]
      }, 'Wind Direction'
    )

    this.createCharacteristicClass(
      'WindSpeed', '49C8AE5A-A3A5-41AB-BF1F-12D5654F9F41', {
        format: this.Formats.FLOAT,
        unit: 'km/h',
        maxValue: 100,
        minValue: 0,
        minStep: 0.1,
        perms: [this.Perms.READ, this.Perms.NOTIFY]
      }, 'Wind Speed'
    )

    // ===== Services ==========================================================

    /** @member EveHomeKitTypes#Characteristic
      * @property {Service} AirPressureSensor - Used by: Eve Degree.
      * @property {Service} ContactSensor - Used by: Eve Door.
      * @property {Service} History - Used for displaying history.
      * @property {Service} MotionSensor - Used by: Eve Motion.
      * @property {Service} Outlet - Used by: Eve Energy.
      * @property {Service} TemperatureSensor - Used by: Eve Degree, Eve Room.
      * @property {Service} Thermostat - Used by: Eve Thermo.
      * @property {Service} Weather - Used by: Eve Weather.
      */

    // Used in Eve Weather
    this.createServiceClass('Weather', uuid('001'), [
      this.Characteristics.CurrentTemperature
    ], [
      this.hapCharacteristics.CurrentRelativeHumidity,
      this.Characteristics.AirPressure
    ])

    this.createServiceClass('History', uuid('007'), [
      this.Characteristics.HistoryRequest,
      this.Characteristics.SetTime,
      this.Characteristics.HistoryStatus,
      this.Characteristics.HistoryEntries
    ], [
      // this.Characteristics.Char11E,
      this.Characteristics.ResetTotal
      // this.Characteristics.Char11D,
      // this.Characteristics.Char131
    ])

    // Used in Eve Degree
    this.createServiceClass('AirPressureSensor', uuid('00A'), [
      this.Characteristics.AirPressure,
      this.Characteristics.Elevation
    ])

    // Used in Eve Door
    this.createServiceClass('ContactSensor', this.hapServices.ContactSensor.UUID, [
      this.hapCharacteristics.ContactSensorState,
      this.Characteristics.TimesOpened,
      this.Characteristics.OpenDuration,
      this.Characteristics.ClosedDuration,
      this.Characteristics.LastActivation
    ])

    // Used in Eve Motion
    this.createServiceClass('MotionSensor', this.hapServices.MotionSensor.UUID, [
      this.hapCharacteristics.MotionDetected,
      this.Characteristics.Sensitivity,
      this.Characteristics.Duration,
      this.Characteristics.LastActivation
    ])

    // Used in Eve Energy
    this.createServiceClass('Outlet', this.hapServices.Outlet.UUID, [
      this.hapCharacteristics.On,
      this.hapCharacteristics.InUse,
      this.Characteristics.Voltage,
      this.Characteristics.ElectricCurrent,
      this.Characteristics.CurrentConsumption,
      this.Characteristics.TotalConsumption
    ])

    // Used in Eve Degree
    this.createServiceClass(
      'TemperatureSensor', this.hapServices.TemperatureSensor.UUID, [
        this.Characteristics.CurrentTemperature,
        this.hapCharacteristics.TemperatureDisplayUnits
      ]
    )

    // Used in Eve Thermo
    this.createServiceClass('Thermostat', this.hapServices.Thermostat.UUID, [
      this.hapCharacteristics.CurrentHeatingCoolingState,
      this.hapCharacteristics.TargetHeatingCoolingState,
      this.Characteristics.CurrentTemperature,
      this.hapCharacteristics.TargetTemperature,
      this.hapCharacteristics.TemperatureDisplayUnits,
      this.Characteristics.ValvePosition
    ], [
      this.Characteristics.ProgramCommand,
      this.Characteristics.ProgramData
    ])
  }
}

module.exports = EveHomeKitTypes
