// homebridge-lib/lib/MyHomeKitTypes.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2020 Erik Baauw. All rights reserved.
//
// My own collection of custom HomeKit Services and Characteristics.

const homebridgeLib = require('../index')

function uuid (id) {
  return MyHomeKitTypes.uuid(id, '-0000-1000-8000-656261617577')
}

/**
 * My own collection of custom HomeKit Services and Characteristics.
 * @extends CustomHomeKitTypes
 */
class MyHomeKitTypes extends homebridgeLib.CustomHomeKitTypes {
  /**
   * Create my custom HomeKit Services and Characteristics.
   * @param {object} homebridge - API object from homebridge
   */
  constructor (homebridge) {
    super(homebridge)

    // ===== Characteristics ===================================================

    /** @member MyHomeKitTypes#Characteristics
      * @property {Class} Alarm
      * @property {Class} AnyOn
      * @property {Class} Balance
      * @property {Class} Bass
      * @property {Class} BrightnessChange
      * @property {Class} ChangeInput
      * @property {Class} ChangeTrack
      * @property {Class} ChangeVolume
      * @property {Class} CpuFrequency - CPU clock speed (in MHz)
      * @property {Class} CpuLoad - CPU load average (last minute)
      * @property {Class} CpuThrottled - CPU throttled
      * @property {Class} CpuUnderVoltage - CPU under voltage
      * @property {Class} CpuVoltage - CPU voltage (in V)
      * @property {Class} CurrentTrack
      * @property {Class} Dark - LightLevel is below dark threshold.
      * @property {Class} Daylight - LightLevel is above daylight threshold.
      * @property {Class} Duration
      * @property {Class} Enabled - Enable/disable service.
      * @property {Class} Heartrate - Refresh rate.
      * @property {Class} LastEvent
      * @property {Class} LastTriggered - Date/time rule was last triggered.
      * @property {Class} LastUpdated - Date/time state was last triggered.
      * @property {Class} Link - Link button on the Hue bridge.
      * @property {Class} Locked - Deprecated,
      * use Characteristics.hap.LockPhysicalControls.
      * @property {Class} Loudness
      * @property {Class} NightSound
      * @property {Class} Offset
      * @property {Class} Period
      * @property {Class} Resource - REST API resource corresponding for service.
      * @property {Class} Sensitivity - Deprecated,
      * use Characteristics.hap.Sensitivity.
      * @property {Class} SonosCoordinator
      * @property {Class} SonosGroup
      * @property {Class} SpeechEnhancement
      * @property {Class} Status - Generic status.
      * @property {Class} Streaming
      * @property {Class} Sunrise - Date/time of today's sun rise.
      * @property {Class} Sunset - Date/time of today's sun set.
      * @property {Class} Tariff
      * @property {Class} Time
      * @property {Class} TimesTriggered - Number of times rule has been triggered.
      * @property {Class} TotalConsumptionLow
      * @property {Class} TotalConsumptionNormal
      * @property {Class} Touchlink - Initiate touchlink.
      * @property {Class} TransitionTime - Transition time.
      * @property {Class} Treble
      * @property {Class} Tv
      * @property {Class} UniqueID
      */

    // Used by homebridge-hue.
    this.createCharacteristicClass('Resource', uuid('021'), {
      format: this.Formats.STRING,
      perms: [this.Perms.READ]
    })

    // Used by homebridge-hue.
    this.createCharacteristicClass('Enabled', uuid('022'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    })

    // Used by homebridge-hue.
    this.createCharacteristicClass('LastUpdated', uuid('023'), {
      format: this.Formats.STRING,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Last Updated')

    // Used by homebridge-hue in HueBridge service.
    this.createCharacteristicClass('Heartrate', uuid('024'), {
      format: this.Formats.UINT8,
      unit: this.Units.SECONDS,
      minValue: 1,
      maxValue: 30,
      minStep: 1,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    })

    // Used by homebridge-hue in LightSensor service.
    this.createCharacteristicClass('Dark', uuid('025'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    })

    // Used by homebridge-hue in LightSensor service.
    this.createCharacteristicClass('Daylight', uuid('026'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    })

    // Used by homebridge-hue in Status service.
    this.createCharacteristicClass('Status', uuid('027'), {
      format: this.Formats.INT,
      // Eve 3.1 displays the following controls, depending on the properties:
      // 1. {minValue: 0, maxValue: 1, minStep: 1}                    switch
      // 2. {minValue: a, maxValue: b, minStep: 1}, 1 < b - a <= 20   down|up
      // 3. {minValue: a, maxValue: b}, (a, b) != (0, 1)              slider
      // 4. {minValue: a, maxValue: b, minStep: 1}, b - a > 20        slider
      // Avoid the following bugs:
      // 5. {minValue: 0, maxValue: 1}                                nothing
      // 6. {minValue: a, maxValue: b, minStep: 1}, b - a = 1         switch*
      //    *) switch sends values 0 and 1 instead of a and b;
      minValue: -127,
      maxValue: 127,
      // Don't specify minStep here, so plugins can select the Eve control.
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    })

    // Used by homebridge-hue in for group LightBulb or Switch service.
    this.createCharacteristicClass('AnyOn', uuid('028'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE
      ]
    })

    // Used by homebridge-hue in Resource service.
    this.createCharacteristicClass('LastTriggered', uuid('029'), {
      format: this.Formats.STRING,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Last Triggered')

    // Used by homebridge-hue in Resource service.
    this.createCharacteristicClass('TimesTriggered', uuid('02A'), {
      format: this.Formats.INT,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Times Triggered')

    // Used by homebridge-hue in MotionSensor service.
    // Deprecated in favour of Eve's Sensitivity characteristic.
    this.createCharacteristicClass('Sensitivity', uuid('02B'), {
      format: this.Formats.UINT8,
      minValue: 0,
      maxValue: 127,
      minStep: 1,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    })

    // Used by homebridge-hue in MotionSensor service.
    // Deprecated in favour of Eve's Durarion characteristic.
    this.createCharacteristicClass('Duration', uuid('02C'), {
      format: this.Formats.UINT16,
      unit: this.Units.SECONDS,
      minValue: 0,
      maxValue: 7200,
      minStep: 1,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    })

    // Used by homebridge-hue in HueBridge service.
    this.createCharacteristicClass('Link', uuid('02D'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    })

    // Used by homebridge-hue in HueBridge service.
    this.createCharacteristicClass('Touchlink', uuid('02E'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    })

    // Used by homebridge-hue in HueBridge service.
    this.createCharacteristicClass('TransitionTime', uuid('02F'), {
      format: this.Formats.FLOAT,
      unit: this.Units.SECONDS,
      minValue: 0,
      maxValue: 3600,
      minStep: 0.1,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    }, 'Transition Time')

    // Used by homebridge-hue in Temperature service.
    this.createCharacteristicClass('Offset', uuid('030'), {
      format: this.Formats.FLOAT,
      unit: this.Units.CELSIUS,
      maxValue: 5,
      minValue: -5,
      minStep: 0.1,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    })

    // Used by homebridge-p1 in Electricity service.
    this.createCharacteristicClass('Tariff', uuid('031'), {
      format: this.Formats.STRING,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    })

    // Used by homebridge-hue for Alarm service.
    this.createCharacteristicClass('Alarm', uuid('032'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    })

    // Used by homebridge-hue for Daylight sensor.
    this.createCharacteristicClass('Period', uuid('033'), {
      format: this.Formats.STRING,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    })

    // Used by homebridge-hue for Daylight sensor.
    this.createCharacteristicClass('LastEvent', uuid('034'), {
      format: this.Formats.STRING,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Last Event')

    // Used by homebridge-hue for Thermostat sensor.
    // Deprecated - use this.hapCharacteristics.LockPhysicalControls instead.
    this.createCharacteristicClass('Locked', uuid('035'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    }, 'Locked')

    // Used by homebridge-p1 in Electricity service.
    this.createCharacteristicClass('TotalConsumptionNormal', uuid('036'), {
      format: this.Formats.FLOAT,
      unit: 'kWh',
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Total Consumption Normal')

    // Used by homebridge-p1 in Electricity service.
    this.createCharacteristicClass('TotalConsumptionLow', uuid('037'), {
      format: this.Formats.FLOAT,
      unit: 'kWh',
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Total Consumption Low')

    // Used by homebridge-hue for Hue Entertainment groups.
    this.createCharacteristicClass('Streaming', uuid('038'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    })

    // Used by homebridge-zp in Speaker service.
    this.createCharacteristicClass('Bass', uuid('041'), {
      format: this.Formats.INT,
      minValue: -10,
      maxValue: 10,
      minStep: 1,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    })

    // Used by homebridge-zp in Speaker service.
    this.createCharacteristicClass('Treble', uuid('042'), {
      format: this.Formats.INT,
      minValue: -10,
      maxValue: 10,
      minStep: 1,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    })

    // Used by homebridge-zp in Speaker service.
    this.createCharacteristicClass('Loudness', uuid('043'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY,
        this.Perms.WRITE]
    })

    // Used by homebridge-zp in Speaker service.
    this.createCharacteristicClass('Balance', uuid('044'), {
      format: this.Formats.INT,
      unit: this.Units.PERCENTAGE,
      minValue: -100,
      maxValue: 100,
      minStep: 5,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    })

    // Used by homebridge-zp in Sonos service.
    this.createCharacteristicClass('CurrentTrack', uuid('045'), {
      format: this.Formats.STRING,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Track')

    // Used by homebridge-zp in Sonos service.
    this.createCharacteristicClass('SonosGroup', uuid('046'), {
      format: this.Formats.STRING,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Sonos Group')

    // Used by homebridge-zp in Sonos service.
    this.createCharacteristicClass('ChangeTrack', uuid('047'), {
      format: this.Formats.INT,
      minValue: -1,
      maxValue: 1,
      minStep: 1, // Force Down|Up control in Eve
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    }, 'Track Change')

    // Used by homebridge-zp in Sonos and Speaker service.
    this.createCharacteristicClass('ChangeVolume', uuid('049'), {
      format: this.Formats.INT,
      minValue: -10,
      maxValue: 10,
      minStep: 1, // Force Down|Up control in Eve
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    }, 'Volume Change')

    // Used by homebridge-zp in Sonos service.
    this.createCharacteristicClass('ChangeInput', uuid('04A'), {
      format: this.Formats.INT,
      minValue: -1,
      maxValue: 1,
      minStep: 1, // Force Down|Up control in Eve
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    }, 'Input Change')

    // Used by homebridge-zp in Speaker service.
    this.createCharacteristicClass('NightSound', uuid('04B'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    }, 'Night Sound')

    // Used by homebridge-zp in Speaker service.
    this.createCharacteristicClass('SpeechEnhancement', uuid('04C'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    }, 'Speech Enhancement')

    // Used by homebridge-zp in Sonos service.
    this.createCharacteristicClass('SonosCoordinator', uuid('04D'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    }, 'Sonos Coordinator')

    // Used by homebridge-zp in Sonos service.
    this.createCharacteristicClass('Tv', uuid('04E'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'TV')

    // Used by homebridge-zp in Alarm service.
    this.createCharacteristicClass('Time', uuid('04F'), {
      format: this.Formats.STRING,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Time')

    // Used by homebridge-rpi.
    this.createCharacteristicClass('CpuFrequency', uuid('050'), {
      format: this.Formats.INT,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Frequency')

    // Used by homebridge-rpi.
    this.createCharacteristicClass('CpuLoad', uuid('051'), {
      format: this.Formats.FLOAT,
      minStep: 0.01,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Load')

    // Used by homebridge-rpi.
    this.createCharacteristicClass('CpuThrottled', uuid('052'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Throttled')

    // Used by homebridge-rpi.
    this.createCharacteristicClass('CpuUnderVoltage', uuid('053'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Under Voltage')

    // Used by homebridge-rpi.
    this.createCharacteristicClass('CpuVoltage', uuid('054'), {
      format: this.Formats.FLOAT,
      minStep: 0.0001,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Voltage')

    // Used by homebridge-hue.
    this.createCharacteristicClass('Sunrise', uuid('055'), {
      format: this.Formats.STRING,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    })

    // Used by homebridge-hue.
    this.createCharacteristicClass('Sunset', uuid('056'), {
      format: this.Formats.STRING,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    })

    // Used by homebridge-hue.
    this.createCharacteristicClass('BrightnessChange', uuid('057'), {
      format: this.Formats.INT,
      minValue: -20,
      maxValue: 20,
      minStep: 1,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    }, 'Brightness Change')

    // Used by homebridge-hue.
    this.createCharacteristicClass('Restart', uuid('058'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    })

    // Used by homebridge-hue.
    this.createCharacteristicClass('ColorLoop', uuid('059'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.READ, this.Perms.NOTIFY, this.Perms.WRITE]
    }, 'Color Loop')

    // Used by homebridge-otgw
    this.createCharacteristicClass('ReturnWaterTemperature', uuid('05A'), {
      format: this.Formats.FLOAT,
      unit: this.Units.CELSIUS,
      maxValue: 100,
      minValue: 0,
      minStep: 0.1,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Return Water Temperature')

    // Used by homebridge-otgw
    this.createCharacteristicClass('WaterPressure', uuid('05B'), {
      format: this.Formats.FLOAT,
      unit: 'bar',
      maxValue: 5,
      minValue: 0,
      minStep: 0.1,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Water Pressure')

    // Used by homebridge-otgw
    this.createCharacteristicClass('BurnerStarts', uuid('05C'), {
      format: this.Formats.INT,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Burner Starts')

    // Used by homebridge-otgw
    this.createCharacteristicClass('PumpStarts', uuid('05D'), {
      format: this.Formats.INT,
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Pump Starts')

    // Used by homebridge-otgw
    this.createCharacteristicClass('BurnerHours', uuid('05E'), {
      format: this.Formats.INT,
      unit: 'h',
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Burner Hours')

    // Used by homebridge-otgw
    this.createCharacteristicClass('PumpHours', uuid('05F'), {
      format: this.Formats.INT,
      unit: 'h',
      perms: [this.Perms.READ, this.Perms.NOTIFY]
    }, 'Pump Hours')

    // Characteristic for Unique ID, used by homebridge-hue.
    // Source: as exposed by the Philips Hue bridge.  This characteristic is
    // used by the Hue app to select the accessories when syncing Hue bridge
    // Room groups to HomeKit rooms.
    this.createCharacteristicClass(
      'UniqueID', 'D8B76298-42E7-5FFD-B1D6-1782D9A1F936', {
        format: this.Formats.STRING,
        perms: [this.Perms.READ]
      }, 'Unique ID'
    )

    // ===== Services ==========================================================

    // Used by homebridge-hue for a schedule or rule.
    this.createServiceClass('Resource', uuid('011'), [], [
      this.Characteristics.LastTriggered,
      this.Characteristics.TimesTriggered,
      this.hapCharacteristics.StatusActive,
      this.Characteristics.Enabled,
      this.Characteristics.Resource
    ])

    // Used by homebridge-hue for a Hue bridge or deCONZ gateway.
    this.createServiceClass('HueBridge', uuid('012'), [
      this.Characteristics.Heartrate,
      this.Characteristics.LastUpdated,
      this.Characteristics.TransitionTime
    ], [
      this.Characteristics.Link,
      this.Characteristics.Restart,
      this.Characteristics.Touchlink
    ])

    // Used by homebridge-hue for a CLIPGenericStatus sensor.
    this.createServiceClass('Status', uuid('013'), [
      this.Characteristics.Status
    ])

    // Used by homebridge-zp.
    this.createServiceClass('Alarm', uuid('048'), [
      this.Characteristics.Enabled,
      this.Characteristics.CurrentTrack,
      this.Characteristics.Time
    ])

    // Used by homebridge-zp.
    // Note that a different UUID might be used depending on the config.json
    // setting for "service".
    this.createServiceClass('Sonos', this.hapServices.Switch.UUID, [
      this.hapCharacteristics.On,
      this.hapCharacteristics.Volume,
      this.Characteristics.ChangeVolume,
      this.hapCharacteristics.Mute,
      this.Characteristics.CurrentTrack,
      this.Characteristics.ChangeTrack,
      this.Characteristics.SonosGroup,
      this.Characteristics.SonosCoordinator
    ], [
      this.Characteristics.Tv
    ])

    // Used by homebridge-zp.
    // Note that a different UUID might be used depending on the config.json
    // setting for "service".
    this.createServiceClass('Speaker', this.hapServices.Switch.UUID, [
      this.hapCharacteristics.On,
      this.hapCharacteristics.Volume,
      this.Characteristics.ChangeVolume,
      this.hapCharacteristics.Mute,
      this.Characteristics.Bass,
      this.Characteristics.Treble,
      this.Characteristics.Loudness
    ], [
      this.Characteristics.Balance,
      this.Characteristics.NightSound,
      this.Characteristics.SpeechEnhancement
    ])
  }
}

module.exports = MyHomeKitTypes
