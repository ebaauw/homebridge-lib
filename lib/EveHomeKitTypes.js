// homebridge-lib/lib/EveHomeKitTypes.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2025 Erik Baauw. All rights reserved.

import { CustomHomeKitTypes } from 'homebridge-lib/CustomHomeKitTypes'

// Return long Eve UUID.
function uuid (id) {
  if (typeof id !== 'string' || id.length !== 3) {
    throw new TypeError(`${id}: illegal id`)
  }
  // UUID range used by Eve
  return `E863F${id}-079E-48FF-8F27-9C2605A29F52`
}

/** Custom HomeKit services and characteristics used by
  * [Eve](https://www.evehome.com/en) accessories and by the
  * [Eve app](https://www.evehome.com/en/eve-app).
  * <br>See {@link EveHomeKitTypes}.
  * @name EveHomeKitTypes
  * @type {Class}
  * @memberof module:homebridge-lib
  */

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
class EveHomeKitTypes extends CustomHomeKitTypes {
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
      * @property {Class} AirParticulateDensity - Deprecated. use `VOCLevel`
      * instead.
      * @property {Class} AirPressure - Air pressure (in hPa).
      * <br>Used by: Eve Weather.
      * @property {Class} ClosedDuration - Duration (in seconds) that door has
      * been closed.
      * <br>Used by: Eve Door.
      * @property {Class} Clouds - Cloud coverage (in %).
      * <br>Used by: weather station.
      * @property {Class} ColorTemperature - Colour temperature in mired.
      * <br>Used by: Hue bridge, before `hap.ColorTemperature` was defined.
      * @property {Class} ColorTemperatureKelvin - Color temperature in K.
      * <br> Used by: Nanoleaf.
      * @property {Class} Condition - Weather condition (as text).
      * <br>Used by: weather station.
      * @property {Class} ConditionCategory - Weather condition
      * (as numberic code).
      * <br>Used by: weather station.
      * @property {Class} ConfigCommand - Used by Eve app to set configuration.
      * <br> Used by: `History` service.
      * @property {Class} ConfigData - Used by Eve app to read configuration.
      * <br> Used by: `History` service.
      * @property {Class} Consumption - Current electric power (in W).
      * <br>Used by: Eve Energy.
      * @property {Class} CurrentConsumption -  Deprecated. use `Consumption`
      * instead.
      * @property {Class} CurrentTemperature - Current temperature (in °C).
      * This is the same characterisic as `hap.CurrentTemperature`, but with
      * a minimum value of -40°C instead of 0°C (or -270°C).
      * @property {Class} Day - Weekday for forecast.
      * <br>Used by: weather station.
      * @property {Class} DewPoint - Dew point (in °C).
      * <br>Used by: weather station.
      * @property {Class} Duration - Duration (in s) that Motion sensor reports
      * motion.
      * <br>Used by: Eve Motion.
      * <br>Shown by Eve app in accessory _Settings_ screen.
      * @property {Class} ElectricCurrent - Electric current (in A).
      * <br>Used by: Eve Energy.
      * @property {Class} Elevation - Elevation (in m) to calibrate air
      * pressure.
      * <br>Used by: Eve Weather.
      * <br>Shown by Eve app in accessory _Settings_ screen.
      * @property {Class} HistoryEntries - Used by accessory to return history
      * entries.
      * <br> Used by: `History` service.
      * @property {Class} HistoryRequest - Used by Eve app to request history
      * entries.
      * <br> Used by: `History` service.
      * @property {Class} HistoryStatus - Used by accessory signal new history
      * entries.
      * <br> Used by: `History` service.
      * @property {Class} LastActivation - Time (in seconds since epoch) of
      * last event.
      * <br>Used by: Eve Door, Eve Motion.
      * @property {Class} MaximumWindSpeed - Maximum wind speed (in m/s).
      * <br>Used by: weather station.
      * @property {Class} MinimumTemperature - Minimum temperature (in °C).
      * <br>Used by: weather station.
      * @property {Class} ObservationTime - Time of observation.
      * <br>Used by: weather station.
      * @property {Class} OpenDuration - Duration (in seconds) that door has
      * been open.
      * <br>Used by: Eve Door.
      * @property {Class} Ozone - Ozone level (in DU).
      * <br>Used by: weather station.
      * @property {Class} ProgramCommand - Used for programming schedules -
      * details unknown.
      * <br>Used by: Eve Thermo.
      * @property {Class} ProgramData - Used for programming schedules -
      * details unknown.
      * <br>Used by: Eve Thermo.
      * @property {Class} Rain - Rain (as boolean).
      * <br>Used by: weather station.
      * @property {Class} Rain1h - Rain (in mm) during past hour.
      * <br>Used by: weather station.
      * @property {Class} Rain24h - Rain (in mm) during past 24 hours.
      * <br>Used by: weather station.
      * @property {Class} RainProbabiliy - Probability of rain (in %).
      * <br>Used by: weather station.
      * @property {Class} ResetTotal - Time (as seconds since epoch) of
      * last reset.
      * <br> Used by: `History` service.
      * @property {Class} Sensitivity - Motion sensor sensitivity.
      * <br>Used by: Eve Motion.
      * <br>Shown by Eve app in accessory _Settings_ screen.
      * @property {Class} SetTime - Used to sync time with accessory.
      * <br> Used by: `History` service.
      * @property {Class} Snow - Snow (as boolean).
      * <br>Used by: weather station.
      * @property {Class} TimesOpened - Number of times the door was opened.
      * <br>Used by: Eve Door.
      * @property {Class} TotalConsumption - Life-time electric consumption
      * (in KWh).
      * <br>Used by: Eve Energy.
      * @property {Class} UvIndex - UV index.
      * <br>Used by: weather station.
      * @property {Class} ValvePosition - Current radiator valve position
      * (in %).
      * <br>Used by: Eve Thermo.
      * @property {Class} Visibility - Visibility (in km).
      * <br>Used by: weather station.
      * @property {Class} VOCLevel - Volatile Organic Compound level (in ppb).
      * <br>Used by: Eve Room (1st gen).
      * @property {Class} Voltage - Electric voltage (in V).
      * <br>Used by: Eve Energy.
      * @property {Class} WindDirection - Wind direction (as text).
      * <br>Used by: weather station.
      * @property {Class} WindSpeed - Wind speed (in m/s).
      * <br>Used by: weather station.
      */

    // =========================================================================

    // The following custom characteristics are defined by Eve.
    // These are listed in order of UUID.

    this.createCharacteristicClass('Voltage', uuid('10A'), {
      format: this.Formats.FLOAT,
      unit: 'V',
      minValue: 0,
      maxValue: 380,
      minStep: 0.1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    })

    this.createCharacteristicClass('AirParticulateDensity', uuid('10B'), {
      format: this.Formats.FLOAT,
      unit: 'ppm',
      minValue: 0,
      maxValue: 5000,
      minStep: 1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'VOC Level')

    this.createCharacteristicClass('VOCLevel', uuid('10B'), {
      format: this.Formats.INT16,
      unit: 'ppb',
      minValue: 5,
      maxValue: 5000,
      minStep: 5,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'VOC Level')

    this.createCharacteristicClass('TotalConsumption', uuid('10C'), {
      format: this.Formats.FLOAT,
      unit: 'kWh',
      minValue: 0,
      maxValue: 1000000,
      minStep: 0.01,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Total Consumption')

    this.createCharacteristicClass('Consumption', uuid('10D'), {
      format: this.Formats.FLOAT,
      unit: 'W',
      minValue: 0,
      maxValue: 12000,
      minStep: 0.1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Consumption')

    this.createCharacteristicClass('CurrentConsumption', uuid('10D'), {
      format: this.Formats.FLOAT,
      unit: 'W',
      minValue: 0,
      maxValue: 12000,
      minStep: 0.1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Consumption')

    this.createCharacteristicClass('AirPressure', uuid('10F'), {
      format: this.Formats.FLOAT,
      unit: 'hPa',
      minValue: 700,
      maxValue: 1100,
      minStep: 0.1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Air Pressure')

    this.createCharacteristicClass('ResetTotal', uuid('112'), {
      format: this.Formats.UINT32,
      unit: this.Units.seconds, // since 2001/01/01
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    }, 'Reset Total')

    this.createCharacteristicClass('HistoryStatus', uuid('116'), {
      format: this.Formats.DATA,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.HIDDEN]
    }, 'History Status')

    this.createCharacteristicClass('HistoryEntries', uuid('117'), {
      format: this.Formats.DATA,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.HIDDEN]
    }, 'History Entries')

    this.createCharacteristicClass('OpenDuration', uuid('118'), {
      format: this.Formats.UINT32,
      unit: this.Units.SECONDS, // since last reset
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Open Duration')

    this.createCharacteristicClass('ClosedDuration', uuid('119'), {
      format: this.Formats.UINT32,
      unit: this.Units.SECONDS, // since last reset
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Closed Duration')

    this.createCharacteristicClass('LastActivation', uuid('11A'), {
      format: this.Formats.UINT32,
      unit: this.Units.SECONDS, // since last reset
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Last Activation')

    this.createCharacteristicClass('HistoryRequest', uuid('11C'), {
      format: this.Formats.DATA,
      perms: [this.Perms.PAIRED_WRITE, this.Perms.HIDDEN]
    }, 'History Request')

    this.createCharacteristicClass('ConfigCommand', uuid('11D'), {
      format: this.Formats.DATA,
      perms: [this.Perms.PAIRED_WRITE, this.Perms.HIDDEN]
    }, 'Config Command')

    // On various Eve devices - presumably for firmware upgrade.
    this.createCharacteristicClass('Char11E', uuid('11E'), {
      format: this.Formats.DATA,
      perms: [this.Perms.PAIRED_READ, this.Perms.PAIRED_WRITE, this.Perms.HIDDEN]
    }, 'Eve 11E')

    this.createCharacteristicClass('Sensitivity', uuid('120'), {
      format: this.Formats.UINT8,
      minValue: 0,
      maxValue: 7,
      validValues: [0, 4, 7],
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })
    this.Characteristics.Sensitivity.HIGH = 0
    this.Characteristics.Sensitivity.MEDIUM = 4
    this.Characteristics.Sensitivity.LOW = 7

    this.createCharacteristicClass('SetTime', uuid('121'), {
      format: this.Formats.DATA,
      perms: [this.Perms.PAIRED_WRITE, this.Perms.HIDDEN]
    })

    this.createCharacteristicClass('ElectricCurrent', uuid('126'), {
      format: this.Formats.FLOAT,
      unit: 'A',
      minValue: 0,
      maxValue: 48,
      minStep: 0.01,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Electric Current')

    this.createCharacteristicClass('TimesOpened', uuid('129'), {
      format: this.Formats.UINT32,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Times Opened')

    this.createCharacteristicClass('ProgramCommand', uuid('12C'), {
      format: this.Formats.DATA,
      perms: [this.Perms.PAIRED_WRITE]
    }, 'Program Command')

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
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })
    this.Characteristics.Duration.VALID_VALUES = [
      5, 10, 20, 30,
      1 * 60, 2 * 60, 3 * 60, 5 * 60, 10 * 60, 20 * 60, 30 * 60,
      1 * 3600, 2 * 3600, 3 * 3600, 5 * 3600, 10 * 3600, 12 * 3600, 15 * 3600
    ]

    this.createCharacteristicClass('ValvePosition', uuid('12E'), {
      format: this.Formats.UINT8,
      unit: this.Units.PERCENTAGE,
      minValue: 0,
      maxValue: 100,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Valve Position')

    this.createCharacteristicClass('ProgramData', uuid('12F'), {
      format: this.Formats.DATA,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Program Data')

    this.createCharacteristicClass('Elevation', uuid('130'), {
      format: this.Formats.INT,
      unit: 'm',
      minValue: -450,
      maxValue: 9000,
      minStep: 1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })

    this.createCharacteristicClass('ConfigData', uuid('131'), {
      format: this.Formats.DATA,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Config Data')

    this.createCharacteristicClass('ElgatoDeviceStatus', uuid('134'), {
      format: this.Formats.UINT32,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    })
    this.Characteristics.ElgatoDeviceStatus.SMOKE_DETECTED = 1 << 0
    this.Characteristics.ElgatoDeviceStatus.HEAT_DETECTED = 1 << 1
    this.Characteristics.ElgatoDeviceStatus.ALARM_TEST_ACTIVE = 1 << 2
    this.Characteristics.ElgatoDeviceStatus.SMOKE_CHAMBER = 1 << 9
    this.Characteristics.ElgatoDeviceStatus.SMOKE_SENSOR_DEACTIVATED = 1 << 14
    this.Characteristics.ElgatoDeviceStatus.FLASH_STATUS_LED = 1 << 15
    this.Characteristics.ElgatoDeviceStatus.ALARM_PAUSED = 1 << 24
    this.Characteristics.ElgatoDeviceStatus.ALARM_MUTED = 1 << 25

    this.createCharacteristicClass('WeatherTrend', uuid('136'), {
      format: this.Formats.UINT8,
      minValue: 0,
      maxValue: 15,
      minStep: 1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Weather Trend')
    this.Characteristics.WeatherTrend.BLANK = 0 // also: 2, 8, 10
    this.Characteristics.WeatherTrend.SUN = 1 // also: 9
    this.Characteristics.WeatherTrend.CLOUDS_SUN = 3 // also: 11
    this.Characteristics.WeatherTrend.RAIN = 4 // also: 5, 6, 7
    this.Characteristics.WeatherTrend.RAIN_WIND = 12 // also: 13, 14, 15

    // On various Eve devices - presumably for firmware upgrade.
    this.createCharacteristicClass('Char158', uuid('158'), {
      format: this.Formats.DATA,
      perms: [this.Perms.PAIRED_READ, this.Perms.PAIRED_WRITE, this.Perms.HIDDEN]
    }, 'Eve 158')

    // =========================================================================

    // The following custom characteristics are supported by the Eve app.
    // These are listed in alphabetical order.

    this.createCharacteristicClass(
      'Clouds', '64392FED-1401-4F7A-9ADB-1710DD6E3897', {
        format: this.Formats.UINT8,
        unit: this.Units.PERCENTAGE,
        minValue: 0,
        maxValue: 100,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }
    )

    this.createCharacteristicClass(
      'ColorTemperature', 'E887EF67-509A-552D-A138-3DA215050F46', {
        format: this.Formats.UINT16,
        unit: 'mired',
        minValue: 153,
        maxValue: 500,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
      }, 'Color Temperature'
    )

    this.createCharacteristicClass(
      'ColorTemperatureKelvin', 'A18E5901-CFA1-4D37-A10F-0071CEEEEEBD', {
        format: this.Formats.UINT16,
        unit: 'K',
        minValue: 2000, // ct: 500
        maxValue: 6536, // ct: 153
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
      }, 'Color Temperature'
    )

    this.createCharacteristicClass(
      'Condition', 'CD65A9AB-85AD-494A-B2BD-2F380084134D', {
        format: this.Formats.STRING,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }
    )

    this.createCharacteristicClass(
      'ConditionCategory', 'CD65A9AB-85AD-494A-B2BD-2F380084134C', {
        format: this.Formats.UINT16,
        mavValue: 999,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }, 'Condition Category'
    )

    this.createCharacteristicClass(
      'CurrentTemperature', this.hapCharacteristics.CurrentTemperature.UUID, {
        format: this.Formats.FLOAT,
        unit: this.Units.CELSIUS,
        minValue: -40,
        maxValue: 100,
        minStep: 0.1,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }, 'Current Temperature'
    )

    this.createCharacteristicClass(
      'Day', '57F1D4B2-0E7E-4307-95B5-808750E2C1C7', {
        format: this.Formats.STRING,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }
    )

    this.createCharacteristicClass(
      'DewPoint', '095C46E2-278E-4E3C-B9E7-364622A0F501', {
        format: this.Formats.FLOAT,
        unit: this.Units.CELSIUS,
        minValue: -40,
        maxValue: 100,
        minStep: 0.1,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }, 'Dew Point'
    )

    this.createCharacteristicClass(
      'MaximumWindSpeed', '6B8861E5-D6F3-425C-83B6-069945FFD1F1', {
        format: this.Formats.FLOAT,
        unit: 'm/s',
        minValue: 0,
        maxValue: 150,
        minStep: 0.1,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }, 'Maximum Wind Speed'
    )

    this.createCharacteristicClass(
      'MinimumTemperature', '707B78CA-51AB-4DC9-8630-80A58F07E419', {
        format: this.Formats.FLOAT,
        unit: this.Units.CELSIUS,
        minValue: -40,
        maxValue: 100,
        minStep: 0.1,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }, 'Minimum Temperature'
    )

    this.createCharacteristicClass(
      'ObservationTime', '234FD9F1-1D33-4128-B622-D052F0C402AF', {
        format: this.Formats.STRING,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }, 'Observation Time'
    )

    this.createCharacteristicClass(
      'Ozone', 'BBEFFDDD-1BCD-4D75-B7CD-B57A90A04D13', {
        format: this.Formats.UINT16,
        unit: 'DU',
        minValue: 0,
        maxValue: 500,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }
    )

    this.createCharacteristicClass(
      'Rain', 'F14EB1AD-E000-4EF4-A54F-0CF07B2E7BE7', {
        format: this.Formats.BOOL,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }
    )

    this.createCharacteristicClass(
      'Rain1h', '10C88F40-7EC4-478C-8D5A-BD0C3CCE14B7', {
        format: this.Formats.UINT16,
        unit: 'mm',
        minValue: 0,
        maxValue: 200,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }, 'Rain Last Hour'
    )

    this.createCharacteristicClass(
      'Rain24h', 'CCC04890-565B-4376-B39A-3113341D9E0F', {
        format: this.Formats.UINT16,
        unit: 'mm',
        minValue: 0,
        maxValue: 2000,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }, 'Total Rain'
    )

    this.createCharacteristicClass(
      'RainProbability', 'FC01B24F-CF7E-4A74-90DB-1B427AF1FFA3', {
        format: this.Formats.UINT8,
        unit: this.Units.PERCENTAGE,
        minValue: 0,
        maxValue: 100,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }, 'Rain Probabiliy'
    )

    this.createCharacteristicClass(
      'Snow', 'F14EB1AD-E000-4CE6-BD0E-384F9EC4D5DD', {
        format: this.Formats.BOOL,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }
    )

    this.createCharacteristicClass(
      'UvIndex', '05BA0FE0-B848-4226-906D-5B64272E05CE', {
        format: this.Formats.UINT8,
        minValue: 0,
        maxValue: 10,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }, 'UV Index'
    )

    this.createCharacteristicClass(
      'Visibility', 'D24ECC1E-6FAD-4FB5-8137-5AF88BD5E857', {
        format: this.Formats.UINT8,
        minValue: 0,
        maxValue: 100,
        unit: 'km',
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }
    )

    this.createCharacteristicClass(
      'WindDirection', '46F1284C-1912-421B-82F5-EB75008B167E', {
        format: this.Formats.STRING,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }, 'Wind Direction'
    )

    this.createCharacteristicClass(
      'WindSpeed', '49C8AE5A-A3A5-41AB-BF1F-12D5654F9F41', {
        format: this.Formats.FLOAT,
        unit: 'm/s',
        minValue: 0,
        maxValue: 150,
        minStep: 0.1,
        perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
      }, 'Wind Speed'
    )

    // =========================================================================

    // The following custom services are defined by Eve.
    // These are listed in order of UUID.

    /** @member EveHomeKitTypes#Services
      * @property {Service} AirPressureSensor - Used by: Eve Degree.
      * @property {Service} ContactSensor - Used by: Eve Door.
      * @property {Service} History - Used for displaying history.
      * @property {Service} MotionSensor - Used by: Eve Motion.
      * @property {Service} Outlet - Used by: Eve Energy.
      * @property {Service} TemperatureSensor - Used by: Eve Degree, Eve Room.
      * @property {Service} Thermostat - Used by: Eve Thermo.
      * @property {Service} Weather - Used by: Eve Weather.
      */

    this.createServiceClass('Weather', uuid('001'), [
      this.Characteristics.CurrentTemperature
    ], [
      this.hapCharacteristics.CurrentRelativeHumidity,
      this.Characteristics.AirPressure
    ])

    this.createServiceClass('History', uuid('007'), [
      this.Characteristics.HistoryStatus, // 116
      this.Characteristics.HistoryEntries, // 117
      this.Characteristics.HistoryRequest, // 11C
      this.Characteristics.SetTime // 121
    ], [
      this.Characteristics.ResetTotal // 112
      // this.Characteristics.ConfigCommand, // 11D
      // this.Characteristics.ConfigData, // 131
      // this.Characteristics.Char11E, // presumably for firmware upgrade
      // this.Characteristics.Char158, // presumably for firmware upgrade
    ])

    this.createServiceClass('Consumption', uuid('008'), [], [
      this.Characteristics.Voltage, // 10A
      this.Characteristics.TotalConsumption, // 10C
      this.Characteristics.Consumption, // 10D
      this.Characteristics.ElectricCurrent, // 126
      this.hapCharacteristics.StatusFault,
      this.hapCharacteristics.LockPhysicalControls
    ])

    this.createServiceClass('AirPressureSensor', uuid('00A'), [
      this.Characteristics.AirPressure,
      this.Characteristics.Elevation
    ])

    // =========================================================================

    // The following services are used by Eve.
    // These are listed in alphabetical order.

    this.createServiceClass(
      'ContactSensor', this.hapServices.ContactSensor.UUID, [
        this.hapCharacteristics.ContactSensorState,
        this.Characteristics.TimesOpened,
        this.Characteristics.OpenDuration,
        this.Characteristics.ClosedDuration,
        this.Characteristics.LastActivation
      ]
    )

    this.createServiceClass(
      'MotionSensor', this.hapServices.MotionSensor.UUID, [
        this.hapCharacteristics.MotionDetected,
        this.Characteristics.Sensitivity,
        this.Characteristics.Duration,
        this.Characteristics.LastActivation
      ]
    )

    this.createServiceClass(
      'Outlet', this.hapServices.Outlet.UUID, [
        this.hapCharacteristics.On,
        this.hapCharacteristics.InUse,
        this.Characteristics.Voltage,
        this.Characteristics.ElectricCurrent,
        this.Characteristics.Consumption,
        this.Characteristics.TotalConsumption
      ]
    )

    this.createServiceClass(
      'TemperatureSensor', this.hapServices.TemperatureSensor.UUID, [
        this.Characteristics.CurrentTemperature,
        this.hapCharacteristics.TemperatureDisplayUnits
      ]
    )

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

export { EveHomeKitTypes }
