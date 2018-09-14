// homebridge-lib/lib/EveHomeKitTypes.js
//
// Library for homebridge plug-ins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.
//
// Custom Services and Characteristics as used by Elgato's Eve.
// See: https://gist.github.com/simont77/3f4d4330fa55b83f8ca96388d9004e7d

const homebridgeLib = {
  CustomHomeKitTypes: require('./CustomHomeKitTypes')
}

let hap
const eve = {
  Service: {},
  Characteristic: {},
  uuid: (id) => {
    if (typeof id !== 'string' || id.length !== 3) {
      throw new TypeError(`${id}: illegal id`)
    }
    // UUID range used by Elgato
    return `E863F${id}-079E-48FF-8F27-9C2605A29F52`
  }
}

module.exports = class EveHomeKitTypes extends homebridgeLib.CustomHomeKitTypes {
  constructor (homebridge) {
    super(homebridge, eve)
    hap = homebridge.hap

    // Used in Service.Outlet for Eve Energy
    this.createCharacteristic('Voltage', eve.uuid('10A'), {
      format: this.formats.FLOAT,
      unit: 'V',
      perms: [this.perms.READ, this.perms.NOTIFY]
    })

    // Used in Service.Outlet for Eve Enegergy
    this.createCharacteristic('TotalConsumption', eve.uuid('10C'), {
      format: this.formats.FLOAT,
      unit: 'kWh',
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Total Consumption')

    // Used in Service.Outlet for Eve Enegergy
    this.createCharacteristic('CurrentConsumption', eve.uuid('10D'), {
      format: this.formats.FLOAT,
      unit: 'W',
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Current Consumption')

    // Used in Service.Weather for Eve Weather
    // and in Service.AirPressure for Eve Degree
    this.createCharacteristic('AirPressure', eve.uuid('10F'), {
      format: this.formats.UINT16,
      unit: 'hPa',
      maxValue: 1100,
      minValue: 700,
      minStep: 1,
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Air Pressure')

    // Used in Service.History
    this.createCharacteristic('ResetTotal', eve.uuid('112'), {
      format: this.formats.UINT32,
      unit: this.units.seconds, // since 2001/01/01
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    }, 'Reset Total')

    // Used in Service.History
    this.createCharacteristic('HistoryStatus', eve.uuid('116'), {
      format: this.formats.DATA,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.HIDDEN]
    }, 'History Status')

    // Used in Service.History
    this.createCharacteristic('HistoryEntries', eve.uuid('117'), {
      format: this.formats.UINT32,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.HIDDEN]
    }, 'History Entries')

    // Used in Service.ContactSensor for Eve Door
    this.createCharacteristic('OpenDuration', eve.uuid('118'), {
      format: this.formats.UINT32,
      unit: this.units.SECONDS, // since last reset
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    }, 'Open Duration')

    // Used in Service.ContactSensor for Eve Door
    this.createCharacteristic('ClosedDuration', eve.uuid('119'), {
      format: this.formats.UINT32,
      unit: this.units.SECONDS, // since last reset
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    }, 'Closed Duration')

    // Used in Service.History
    this.createCharacteristic('HistoryRequest', eve.uuid('11C'), {
      format: this.formats.DATA,
      perms: [this.perms.WRITE, this.perms.HIDDEN]
    }, 'History Request')

    // Used in Service.ContactSensor for Eve Door
    // and in Service.MotionSensor for Eve Motion
    this.createCharacteristic('LastActivation', eve.uuid('11A'), {
      format: this.formats.UINT32,
      unit: this.units.SECONDS, // since last reset
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Last Activation')

    // Used in Service.MotionSensor for Eve Motion
    this.createCharacteristic('Sensitivity', eve.uuid('120'), {
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
    this.createCharacteristic('SetTime', eve.uuid('121'), {
      format: this.formats.UINT32,
      units: this.units.SECONDS, // since 2001/01/01
      perms: [this.perms.WRITE, this.perms.HIDDEN]
    })

    // Used in Service.Outlet for Eve Enegergy
    this.createCharacteristic('ElectricCurrent', eve.uuid('126'), {
      format: this.formats.FLOAT,
      unit: 'A',
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Electric Current')

    // Used in Service.ContactSensor for Eve Door
    this.createCharacteristic('TimesOpened', eve.uuid('129'), {
      format: this.formats.UINT32,
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Times Opened')

    // Used in Service.MotionSensor for Eve Motion
    this.createCharacteristic('Duration', eve.uuid('12D'), {
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

    // Used in Service.AirPressure for Eve Degree, presumably for units
    this.createCharacteristic('Elevation', eve.uuid('130'), {
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
    this.createService('Weather', eve.uuid('001'), [
      eve.Characteristic.CurrentTemperature,
      hap.Characteristic.CurrentRelativeHumidity,
      eve.Characteristic.AirPressure
    ])

    this.createService('History', eve.uuid('007'), [
      // eve.Characteristic.Char11E,
      eve.Characteristic.ResetTotal,
      eve.Characteristic.HistoryRequest,
      eve.Characteristic.SetTime,
      eve.Characteristic.HistoryStatus,
      eve.Characteristic.HistoryEntries
      // eve.Characteristic.Char11D,
      // eve.Characteristic.Char131
    ])

    // Used in Eve Degree
    this.createService('AirPressureSensor', eve.uuid('00A'), [
      eve.Characteristic.AirPressure,
      eve.Characteristic.Elevation
    ])

    // Used in Eve Door
    this.createService('ContactSensor', hap.Service.ContactSensor.UUID, [
      hap.Characteristic.ContactSensorState,
      eve.Characteristic.TimesOpened,
      eve.Characteristic.OpenDuration,
      eve.Characteristic.ClosedDuration,
      eve.Characteristic.LastActivation
    ])

    // Used in Eve Motion
    this.createService('MotionSensor', hap.Service.MotionSensor.UUID, [
      hap.Characteristic.MotionDetected,
      eve.Characteristic.Sensitivity,
      eve.Characteristic.Duration,
      eve.Characteristic.LastActivation
    ])

    // Used in Eve Energy
    this.createService('Outlet', hap.Service.Outlet.UUID, [
      hap.Characteristic.On,
      hap.Characteristic.InUse,
      eve.Characteristic.Voltage,
      eve.Characteristic.ElectricCurrent,
      eve.Characteristic.CurrentConsumption,
      eve.Characteristic.TotalConsumption
    ])

    // Used in Eve Degree
    this.createService(
      'TemperatureSensor', hap.Service.TemperatureSensor.UUID, [
        eve.Characteristic.CurrentTemperature,
        hap.Characteristic.TemperatureDisplayUnits
      ]
    )
  }
}
