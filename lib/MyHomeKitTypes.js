// homebridge-lib/lib/MyHomeKitTypes.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2025 Erik Baauw. All rights reserved.
//
// My own collection of custom HomeKit Services and Characteristics.

import { CustomHomeKitTypes } from 'homebridge-lib/CustomHomeKitTypes'

function uuid (id) {
  return MyHomeKitTypes.uuid(id, '-0000-1000-8000-656261617577')
}
/** My own collection of custom HomeKit services and characteristics.
  * <br>See {@link MyHomeKitTypes}.
  * @name MyHomeKitTypes
  * @type {Class}
  * @memberof module:homebridge-lib
  */

/** My own collection of custom HomeKit Services and Characteristics.
  * @extends CustomHomeKitTypes
  */
class MyHomeKitTypes extends CustomHomeKitTypes {
  /**
   * Create my custom HomeKit Services and Characteristics.
   * @param {object} homebridge - API object from homebridge
   */
  constructor (homebridge) {
    super(homebridge)

    // ===== Characteristics ===================================================

    /** @member MyHomeKitTypes#Characteristics
      * @property {Class} Alarm - Alarm condition.
      * <br>Used by: homebridge-hue for Alarm service.
      * @property {Class} AnyOn - Any light in the group is on.
      * <br>Used by: homebridge-hue in for group LightBulb or Outlet service.
      * @property {Class} ApparentTemperature - Apparent temperature.
      * <br>Used by: homebridge-ws.
      * @property {Class} AverageConsumption - Average electrical power (in W).
      * <br>Used by: homebridge-p1.
      * @property {Class} Balance - Audio balance.
      * <br>Used by: homebridge-zp in Speaker service.
      * @property {Class} Bass - Audio bass.
      * <br>Used by: homebridge-zp in Speaker service.
      * @property {Class} BrightnessChange - For relative changes to
      * `Brightness`.
      * <br>Used by: homebridge-hue.
      * @property {Class} BurnerHours - Burner run time (in hours).
      * <br>Used by: homebridge-otgw.
      * @property {Class} BurnerStarts - Number of burner starts.
      * <br>Used by: homebridge-otgw.
      * @property {Class} CampfireEffect - Enabled/disable campfire dynamic effect.
      * <br>Used by: homebridge-deconz.
      * @property {Class} CandleEffect - Enabled/disable candle dynamic effect.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} ChangeInput - For relative changes to `InputSource`.
      * <br>Used by: homebridge-zp in Sonos service.
      * @property {Class} ChangeTrack - For relative changes to `CurrentTrack`.
      * <br>Used by: homebridge-zp in Sonos service.
      * @property {Class} ChangeVolume - For relative changes to `Volume`.
      * <br>Used by: homebridge-zp in Sonos and Speaker service.
      * @property {Class} CloseUpwards - Set to close venetian blinds upwards.
      * <br>Used by: homebridge-sc, homebridge-soma in Window Covering service.
      * @property {Class} ColorLoop - Enabled/disable color loop effect.
      * <br>Used by: homebridge-hue.
      * @property {Class} ColorLoopSpeed - Speed (in sec) of color loop effect.
      * <br>Used by: homebridge-hue.
      * @property {Class} CosmosEffect - Enabled/disable cosmos dynamic effect.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} ContinuousMode - Continuous Mode active.
      * <br>Used by: homebridge-nb.
      * @property {Class} CpuFrequency - CPU clock speed (in MHz).
      * <br>Used by: homebridge-rpi.
      * @property {Class} CpuLoad - CPU load average (last minute).
      * <br>Used by: homebridge-rpi.
      * @property {Class} CpuThrottled - CPU throttled.
      * <br>Used by: homebridge-rpi.
      * @property {Class} CpuUnderVoltage - CPU under voltage.
      * <br>Used by: homebridge-rpi.
      * @property {Class} CpuVoltage - CPU voltage (in mV).
      * <br>Used by: homebridge-rpi.
      * @property {Class} Crossfade - Crossfade tracks.
      * <br>Used by: homebridge-zp in Sonos service.
      * @property {Class} CurrentTrack - Current (audio) track.
      * <br>Used by: homebridge-zp in Sonos service.
      * @property {Class} Dark - LightLevel is below dark threshold.
      * <br>Used by: homebridge-hue in LightSensor service.
      * @property {Class} Daylight - LightLevel is above daylight threshold.
      * <br>Used by: homebridge-hue in LightSensor service.
      * @property {Class} DetectionRange - The range of detection in cm.
      * <br>Used by: homebridge-deconz in MotionSensor service.
      * @property {Class} Distance - The distance of detected human in cm.
      * <br>Used by: homebridge-deconz in MotionSensor service.
      * @property {Class} Duration - Duration (in s) that Motion sensor reports
      * motion.
      * <br>See also: {@link EveHomeKitTypes#Characteristics eve.Duration}.
      * <br>Previously used by homebridge-hue in MotionSensor service.
      * @property {Class} EffectSpeed - Speed (in %) of effect.
      * <br>Used by: homebridge-hue.
      * @property {Class} Enabled - Enable/disable service.
      * <br>Used by: homebridge-hue.
      * @property {Class} EnchantEffect - Enabled/disable enchant dynamic effect.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} Expose - Expose device to HomeKit.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} ExposeGroups - Expose groups to HomeKit.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} ExposeLights - Expose lights devices to HomeKit.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} ExposeSchedules - Expose schdules to HomeKit.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} ExposeSensors - Expose sensors devices to HomeKit.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} FireEffect - Enabled/disable fire dynamic effect.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} FireplaceEffect - Enabled/disable fire dynamic effect.
      * <br>Deprecated - use `FireEffect`.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} GlistenEffect - Enabled/disable glisten dynamic effect.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} Heartrate - Refresh rate.
      * <br>Used by: homebridge-hue in HueBridge service,
      * by Homebridge-soma, by Homebridge-rpi, by Homebridge-ws.
      * @property {Class} HeightLevel - Height channel level.
      * <br>Used by: homebridge-zp in Speaker service.
      * @property {Class} LastBoot - Date/time of last device boot.
      * <br>Used by: homebridge-hue, homebridge-rpi.
      * @property {Class} LastEvent - Last Daylight event (e.g. Noon).
      * <br>Used by: homebridge-hue for Daylight sensor.
      * @property {Class} LastSeen - Date/time of last communication with
      * device.
      * <br>Used by: homebridge-hue.
      * @property {Class} LastTriggered - Date/time rule was last triggered.
      * <br>Used by: homebridge-hue in Resource service.
      * @property {Class} LastUpdated - Date/time state was last updated.
      * <br>Used by: homebridge-hue.
      * @property {Class} Link - Link button on the Hue bridge.
      * <br>Used by: homebridge-hue in HueBridge service.
      * @property {Class} Locked - Physical controls on device are locked.
      * <br>Deprecated - use `hap.LockPhysicalControls`.
      * <br>Previously used by homebridge-hue for Thermostat sensor.
      * @property {Class} LogLevel - Level of logging.
      * @property {Class} LoopEffect - Enabled/disable prism dynamic effect.
      * <br>Deprecated - use `PrismEffect`.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} Loudness - Audio loudness.
      * <br>Used by: homebridge-zp in Speaker service.
      * @property {Class} LowBatteryThreshold - Threshold value for setting
      * Status Low Battery.
      * @property {Class} MotorSpeed - Speed at which to move the blinds.
      * <br>Used by: homebridge-soma in Window Covering service.
      * @property {Class} MorningMode - Move the blinds slowly, making less
      * noise.
      * <br>Used by: homebridge-sc, homebridge-soma in Window Covering service.
      * @property {Class} MusicLevel - Music surround level.
      * <br>Used by: homebridge-zp in Speaker service.
      * @property {Class} MusicPlaybackFull - Surround music playback full.
      * <br>Used by: homebridge-zp in Speaker service.
      * @property {Class} NightlightEffect - Enabled/disable nightlight dynamic effect.
      * <br>Used by: homebridge-deconz.
      * @property {Class} NightSound - Audio night sound.
      * <br>Used by: homebridge-zp in Speaker service.
      * @property {Class} Offset - Temperature offset.
      * <br>Used by: homebridge-hue in Temperature service.
      * @property {Class} OpalEffect - Enabled/disable opal dynamic effect.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} PartyEffect - Enabled/disable party dynamic effect.
      * <br>Used by: homebridge-deconz.
      * @property {Class} Period - Daylight period (e.g. Dawn).
      * <br>Used by: homebridge-hue for Daylight sensor.
      * @property {Class} PrismEffect - Enabled/disable prism dynamic effect.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} PumpHours - Pump run time (in hours).
      * <br>Used by: homebridge-otgw.
      * @property {Class} PumpStarts - Number of pump starts.
      * <br>Used by: homebridge-otgw.
      * @property {Class} Recall - Recall a scene.
      * <br>Used by: homebridge-hue.
      * @property {Class} Repeat - Repeat tracks (off, 1, all).
      * <br>Used by: homebridge-zp.
      * @property {Class} Reset - Reset.
      * <br>Used by: homebridge-deconz to reset a presence sensor.
      * @property {Class} Resource - REST API resource corresponding for
      * service.
      * <br>Used by: homebridge-hue.
      * @property {Class} Restart - Restart device; indication that device has
      * restarted.
      * <br>Used by: homebridge-hue, homebridge-rpi.
      * @property {Class} ReturnWaterTemperature - Temperature of the water
      * returning to the boiler.
      * <br>Used by: homebridge-otgw.
      * @property {Class} RingToOpen - Ring to Open active.
      * <br> Used by: homebridge-nb.
      * @property {Class} RomanceEffect - Enabled/disable romance dynamic effect.
      * <br>Used by: homebridge-deconz.
      * @property {Class} Search - Search for new devices.
      * <br>Used by: homebridge-hue.
      * @property {Class} Sensitivity - Motion sensor sensitivity.
      * <br>See also: {@link EveHomeKitTypes#Characteristics eve.Sensitivity}.
      * <br>Previously used by: homebridge-hue in MotionSensor service.
      * @property {Class} Shuffle - Shuffle tracks.
      * <br>Used by: homebridge-zp.
      * @property {Class} SonosCoordinator - Zone player is target coordinator
      * for grouping.
      * <br>Used by: homebridge-zp in Sonos service.
      * @property {Class} SonosGroup - Current Sonos group to which zone player
      * belongs.
      * <br>Used by: homebridge-zp in Sonos service.
      * @property {Class} SparkleEffect - Enabled/disable sparkle dynamic effect.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} SpeechEnhancement - Audio speech enhancement setting.
      * <br>Used by: homebridge-zp in Speaker service.
      * @property {Class} Status - Generic status.
      * <br>Used by: homebridge-hue in Status service, by homebridge-ws.
      * @property {Class} Streaming - Hue Entertainment streaming.
      * <br>Used by: homebridge-hue for Hue Entertainment groups.
      * @property {Class} SubEnabled - Enabled/disable Sub.
      * <br>Used by: homebridge-zp in Speaker service.
      * @property {Class} SubLevel - Level for the Sub.
      * <br>Used by: homebridge-zp in Speaker service.
      * @property {Class} SunbeamEffect - Enabled/disable sunbeam dynamic effect.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} Sunrise - Date/time of today's sun rise.
      * <br>Used by: homebridge-hue, homebridge-ws.
      * @property {Class} SunriseEffect - Enabled/disable sunrise dynamic effect.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} Sunset - Date/time of today's sun set.
      * <br>Used by: homebridge-hue, homebridge-ws.
      * @property {Class} SunsetEffect - Enabled/disable sunset dynamic effect.
      * <br>Used by: homebridge-deconz.
      * @property {Class} SurroundEnabled - Enabled/disable surround speakers.
      * <br>Used by: homebridge-zp in Speaker service.
      * @property {Class} SwapUsage - The usage of the swapfile in %.
      * <br>Used by: homebridge-rpi.
      * @property {Class} Tariff - Electricity tariff (normal vs low).
      * <br>Used by: homebridge-p1 in Electricity service.
      * @property {Class} TemperatureMax - Maximum temperature.
      * <br>Used by: homebridge-ws.
      * @property {Class} TemperatureMin - Minimum temperature.
      * <br>Used by: homebridge-ws.
      * @property {Class} Time - Time for Sonos alarm.
      * <br>Used by: homebridge-zp in Alarm service.
      * @property {Class} TimesTriggered - Number of times rule has been
      * triggered.
      * <br>Used by: homebridge-hue in Resource service.
      * @property {Class} TotalConsumptionLow - Total consumption under low
      * tariff.
      * <br>Used by: homebridge-p1 in Electricity service.
      * @property {Class} TotalConsumptionNormal - Total consumption under high
      * tariff.
      * <br>Used by: homebridge-p1 in Electricity service.
      * @property {Class} Touchlink - Initiate touchlink.
      * <br>Used by: homebridge-hue in HueBridge service.
      * @property {Class} TransitionTime - Transition time.
      * <br>Used by: homebridge-hue in HueBridge service.
      * @property {Class} Treble - Audio treble.
      * <br>Used by: homebridge-zp in Speaker service.
      * @property {Class} Tv - TV input active.
      * <br>Used by: homebridge-zp in Sonos service.
      * @property {Class} TvLevel - TV surround level.
      * <br>Used by: homebridge-zp in Speaker service.
      * @property {Class} UnderwaterEffect - Enabled/disable underwater dynamic effect.
      * <br>Used by: homebridge-deconz, homebridge-hue2.
      * @property {Class} UniqueID - Used by Hue app to sync room assignments
      * for lights.
      * @property {Class} Unlatch - Unlatch the door.
      * <br>Used by: homebridge-nb in the Smart Lock service.
      * @property {Class} Unlock - Unlock gateway
      * <br>Used by: homebridge-deconz.
      * @property {Class} WaterPressure - Water pressure (in bar) of the central
      * heating system.
      * <br>Used by: homebridge-otgw.
      * @property {Class} WorklightEffect - Enabled/disable worklight dynamic effect.
      * <br>Used by: homebridge-deconz.
      */

    this.createCharacteristicClass('Resource', uuid('021'), {
      format: this.Formats.STRING,
      perms: [this.Perms.PAIRED_READ]
    })

    this.createCharacteristicClass('Enabled', uuid('022'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    })

    this.createCharacteristicClass('LastUpdated', uuid('023'), {
      format: this.Formats.STRING,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Last Updated')

    this.createCharacteristicClass('Heartrate', uuid('024'), {
      format: this.Formats.UINT16,
      unit: this.Units.SECONDS,
      minValue: 1,
      maxValue: 30,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })

    this.createCharacteristicClass('Dark', uuid('025'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    })

    this.createCharacteristicClass('Daylight', uuid('026'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    })

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
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    })

    this.createCharacteristicClass('AnyOn', uuid('028'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE
      ]
    })

    this.createCharacteristicClass('LastTriggered', uuid('029'), {
      format: this.Formats.STRING,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Last Triggered')

    this.createCharacteristicClass('TimesTriggered', uuid('02A'), {
      format: this.Formats.UINT32,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Times Triggered')

    this.createCharacteristicClass('Sensitivity', uuid('02B'), {
      format: this.Formats.UINT8,
      minValue: 0,
      maxValue: 127,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })

    this.createCharacteristicClass('Duration', uuid('02C'), {
      format: this.Formats.UINT16,
      unit: this.Units.SECONDS,
      minValue: 0,
      maxValue: 7200,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })

    this.createCharacteristicClass('Link', uuid('02D'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    })

    this.createCharacteristicClass('Touchlink', uuid('02E'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    })

    this.createCharacteristicClass('TransitionTime', uuid('02F'), {
      format: this.Formats.FLOAT,
      unit: this.Units.SECONDS,
      minValue: 0,
      maxValue: 3600,
      minStep: 0.1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Transition Time')

    this.createCharacteristicClass('Offset', uuid('030'), {
      format: this.Formats.FLOAT,
      unit: this.Units.CELSIUS,
      minValue: -5,
      maxValue: 5,
      minStep: 0.1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })

    this.createCharacteristicClass('Tariff', uuid('031'), {
      format: this.Formats.STRING,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    })

    this.createCharacteristicClass('Alarm', uuid('032'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    })

    this.createCharacteristicClass('Period', uuid('033'), {
      format: this.Formats.STRING,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    })

    this.createCharacteristicClass('LastEvent', uuid('034'), {
      format: this.Formats.STRING,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Last Event')

    this.createCharacteristicClass('Locked', uuid('035'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    }, 'Locked')

    this.createCharacteristicClass('TotalConsumptionNormal', uuid('036'), {
      format: this.Formats.FLOAT,
      unit: 'kWh',
      minValue: 0,
      maxValue: 1000000,
      minStep: 0.1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Total Consumption Normal')

    this.createCharacteristicClass('TotalConsumptionLow', uuid('037'), {
      format: this.Formats.FLOAT,
      unit: 'kWh',
      minValue: 0,
      maxValue: 1000000,
      minStep: 0.1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Total Consumption Low')

    this.createCharacteristicClass('Streaming', uuid('038'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    })

    this.createCharacteristicClass('Bass', uuid('041'), {
      format: this.Formats.INT,
      minValue: -10,
      maxValue: 10,
      minStep: 1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    })

    this.createCharacteristicClass('Treble', uuid('042'), {
      format: this.Formats.INT,
      minValue: -10,
      maxValue: 10,
      minStep: 1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    })

    this.createCharacteristicClass('Loudness', uuid('043'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    })

    this.createCharacteristicClass('Balance', uuid('044'), {
      format: this.Formats.INT,
      unit: this.Units.PERCENTAGE,
      minValue: -100,
      maxValue: 100,
      minStep: 5,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    })

    this.createCharacteristicClass('CurrentTrack', uuid('045'), {
      format: this.Formats.STRING,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Track')

    this.createCharacteristicClass('SonosGroup', uuid('046'), {
      format: this.Formats.STRING,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Sonos Group')

    this.createCharacteristicClass('ChangeTrack', uuid('047'), {
      format: this.Formats.INT,
      minValue: -1,
      maxValue: 1,
      minStep: 1, // Force Down|Up control in Eve
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Track Change')

    this.createCharacteristicClass('ChangeVolume', uuid('049'), {
      format: this.Formats.INT,
      minValue: -10,
      maxValue: 10,
      minStep: 1, // Force Down|Up control in Eve
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Volume Change')

    this.createCharacteristicClass('ChangeInput', uuid('04A'), {
      format: this.Formats.INT,
      minValue: -1,
      maxValue: 1,
      minStep: 1, // Force Down|Up control in Eve
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Input Change')

    this.createCharacteristicClass('NightSound', uuid('04B'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Night Sound')

    this.createCharacteristicClass('SpeechEnhancement', uuid('04C'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Speech Enhancement')

    this.createCharacteristicClass('SonosCoordinator', uuid('04D'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Sonos Coordinator')

    this.createCharacteristicClass('Tv', uuid('04E'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'TV')

    this.createCharacteristicClass('Time', uuid('04F'), {
      format: this.Formats.STRING,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Time')

    this.createCharacteristicClass('CpuFrequency', uuid('050'), {
      format: this.Formats.INT,
      unit: 'MHz',
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Frequency')

    this.createCharacteristicClass('CpuLoad', uuid('051'), {
      format: this.Formats.FLOAT,
      minValue: 0,
      maxValue: 100,
      minStep: 0.01,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Load')

    this.createCharacteristicClass('CpuThrottled', uuid('052'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Throttled')

    this.createCharacteristicClass('CpuUnderVoltage', uuid('053'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Under Voltage')

    this.createCharacteristicClass('Sunrise', uuid('055'), {
      format: this.Formats.STRING,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    })

    this.createCharacteristicClass('Sunset', uuid('056'), {
      format: this.Formats.STRING,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    })

    this.createCharacteristicClass('BrightnessChange', uuid('057'), {
      format: this.Formats.INT,
      minValue: -20,
      maxValue: 20,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Brightness Change')

    this.createCharacteristicClass('Restart', uuid('058'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })

    this.createCharacteristicClass('ColorLoop', uuid('059'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Color Loop')

    this.createCharacteristicClass('ReturnWaterTemperature', uuid('05A'), {
      format: this.Formats.FLOAT,
      unit: this.Units.CELSIUS,
      minValue: 0,
      maxValue: 100,
      minStep: 0.1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Return Water Temperature')

    this.createCharacteristicClass('WaterPressure', uuid('05B'), {
      format: this.Formats.FLOAT,
      unit: 'bar',
      minValue: 0,
      maxValue: 5,
      minStep: 0.1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Water Pressure')

    this.createCharacteristicClass('BurnerStarts', uuid('05C'), {
      format: this.Formats.UINT32,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Burner Starts')

    this.createCharacteristicClass('PumpStarts', uuid('05D'), {
      format: this.Formats.UINT32,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Pump Starts')

    this.createCharacteristicClass('BurnerHours', uuid('05E'), {
      format: this.Formats.UINT32,
      unit: 'h',
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Burner Hours')

    this.createCharacteristicClass('PumpHours', uuid('05F'), {
      format: this.Formats.UINT32,
      unit: 'h',
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Pump Hours')

    this.createCharacteristicClass('LastBoot', uuid('060'), {
      format: this.Formats.STRING,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Last Boot')

    this.createCharacteristicClass('LastSeen', uuid('061'), {
      format: this.Formats.STRING,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Last Seen')

    this.createCharacteristicClass('ApparentTemperature', uuid('062'), {
      format: this.Formats.FLOAT,
      unit: this.Units.CELSIUS,
      minValue: -40,
      maxValue: 100,
      minStep: 0.1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Apparent Temperature')

    this.createCharacteristicClass('TemperatureMin', uuid('063'), {
      format: this.Formats.FLOAT,
      unit: this.Units.CELSIUS,
      minValue: -40,
      maxValue: 100,
      minStep: 0.1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Minimum Temperature')

    this.createCharacteristicClass('TemperatureMax', uuid('064'), {
      format: this.Formats.FLOAT,
      unit: this.Units.CELSIUS,
      minValue: -40,
      maxValue: 100,
      minStep: 0.1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Maximum Temperature')

    this.createCharacteristicClass('LogLevel', uuid('065'), {
      format: this.Formats.UINT8,
      minValue: 0,
      maxValue: 3, // 4 for homebridge-zp
      minStep: 1, // Force Down|Up control in Eve
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    }, 'Log Level')
    this.Characteristics.LogLevel.NONE = 0
    this.Characteristics.LogLevel.LOG = 1
    this.Characteristics.LogLevel.DEBUG = 2
    this.Characteristics.LogLevel.VDEBUG = 3
    this.Characteristics.LogLevel.VVDEBUG = 4

    this.createCharacteristicClass('Repeat', uuid('066'), {
      format: this.Formats.UINT8,
      minValue: 0,
      maxValue: 2,
      minStep: 1, // Force Down|Up control in Eve
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    })
    this.Characteristics.Repeat.NONE = 0
    this.Characteristics.Repeat.ONE = 1
    this.Characteristics.Repeat.ALL = 2

    this.createCharacteristicClass('Shuffle', uuid('067'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    })

    this.createCharacteristicClass('Crossfade', uuid('068'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    })

    this.createCharacteristicClass('RingToOpen', uuid('069'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Ring to Open')

    this.createCharacteristicClass('ContinuousMode', uuid('06A'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Continuous Mode')

    this.createCharacteristicClass('EffectSpeed', uuid('06B'), {
      format: this.Formats.UINT8,
      unit: this.Units.PERCENTAGE,
      minValue: 0,
      maxValue: 100,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Effect Speed')

    this.createCharacteristicClass('ColorLoopSpeed', uuid('06C'), {
      format: this.Formats.UINT16,
      unit: this.Units.SECONDS,
      minValue: 1,
      maxValue: 0xFFFE,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Color Loop Speed')

    this.createCharacteristicClass('SubEnabled', uuid('06D'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Sub Enabled')

    this.createCharacteristicClass('CpuVoltage', uuid('06E'), {
      format: this.Formats.UINT16,
      minValue: 800,
      maxValue: 1400,
      unit: 'mV',
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Voltage')

    this.createCharacteristicClass('CloseUpwards', uuid('06F'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Close Upwards')

    this.createCharacteristicClass('Unlatch', uuid('070'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Unlatch')

    this.createCharacteristicClass('MorningMode', uuid('071'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Morning Mode')

    this.createCharacteristicClass('MotorSpeed', uuid('072'), {
      format: this.Formats.UINT8,
      unit: this.Units.PERCENTAGE,
      minValue: 0,
      maxValue: 100,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Motor Speed')

    this.createCharacteristicClass('Search', uuid('073'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })

    this.createCharacteristicClass('Recall', uuid('074'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    })

    this.createCharacteristicClass('LowBatteryThreshold', uuid('075'), {
      format: this.Formats.UINT8,
      unit: this.Units.PERCENTAGE,
      minValue: 0,
      maxValue: 100,
      minStep: 5,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Low Battery Threshold')

    this.createCharacteristicClass('PositionChange', uuid('076'), {
      format: this.Formats.INT,
      minValue: -1,
      maxValue: 1,
      minStep: 1, // Force Down|Up control in Eve
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Position Change')

    this.createCharacteristicClass('Unlock', uuid('077'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })

    this.createCharacteristicClass('Expose', uuid('078'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })

    this.createCharacteristicClass('ExposeLights', uuid('079'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    }, 'Expose Lights')

    this.createCharacteristicClass('ExposeSensors', uuid('07A'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    }, 'Expose Sensors')

    this.createCharacteristicClass('ExposeGroups', uuid('07B'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    }, 'Expose Groups')

    this.createCharacteristicClass('ExposeSchedules', uuid('07C'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    }, 'Expose Schedules')

    this.createCharacteristicClass('SubLevel', uuid('07D'), {
      format: this.Formats.INT,
      minValue: -15,
      maxValue: 15,
      minStep: 1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Sub Level')

    this.createCharacteristicClass('AverageConsumption', uuid('07E'), {
      format: this.Formats.FLOAT,
      unit: 'W',
      minValue: 0,
      maxValue: 12000,
      minStep: 0.1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Average Consumption')

    // Dynamic effects for Hue lights.

    this.createCharacteristicClass('CandleEffect', uuid('07F'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Candle')

    this.createCharacteristicClass('FireplaceEffect', uuid('080'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Fire')

    this.createCharacteristicClass('FireEffect', uuid('080'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Fire')

    this.createCharacteristicClass('LoopEffect', uuid('081'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Prism')

    this.createCharacteristicClass('PrismEffect', uuid('081'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Prism')

    this.createCharacteristicClass('SunriseEffect', uuid('082'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Sunrise')

    this.createCharacteristicClass('SparkleEffect', uuid('083'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Sparkle')

    // Dynamic effects for MLI lights.

    this.createCharacteristicClass('SunsetEffect', uuid('084'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Sunset')

    this.createCharacteristicClass('PartyEffect', uuid('085'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Party')

    this.createCharacteristicClass('WorklightEffect', uuid('086'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Work Light')

    this.createCharacteristicClass('CampfireEffect', uuid('087'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Camp Fire')

    this.createCharacteristicClass('RomanceEffect', uuid('088'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Romance')

    this.createCharacteristicClass('NightlightEffect', uuid('089'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Night Light')

    // More dynamic effects for Hue lights.

    this.createCharacteristicClass('OpalEffect', uuid('08A'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Opal')

    this.createCharacteristicClass('GlistenEffect', uuid('08B'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Glisten')

    this.createCharacteristicClass('SurroundEnabled', uuid('08C'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Surround Enabled')

    this.createCharacteristicClass('TvLevel', uuid('08D'), {
      format: this.Formats.INT,
      minValue: -15,
      maxValue: 15,
      minStep: 1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'TV Level')

    this.createCharacteristicClass('MusicLevel', uuid('08E'), {
      format: this.Formats.INT,
      minValue: -15,
      maxValue: 15,
      minStep: 1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Music Level')

    this.createCharacteristicClass('MusicPlaybackFull', uuid('08F'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Music Playback Full')

    this.createCharacteristicClass('HeightLevel', uuid('090'), {
      format: this.Formats.INT,
      minValue: -10,
      maxValue: 10,
      minStep: 1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Height Level')

    this.createCharacteristicClass('Distance', uuid('091'), {
      format: this.Formats.INT,
      minValue: 0,
      maxValue: 600,
      minStep: 1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    })

    this.createCharacteristicClass('DetectionRange', uuid('092'), {
      format: this.Formats.INT,
      minValue: 0,
      maxValue: 600,
      minStep: 1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    }, 'Detection Range')

    this.createCharacteristicClass('SwapUsage', uuid('093'), {
      format: this.Formats.INT,
      unit: this.Units.PERCENTAGE,
      minValue: 0,
      maxValue: 100,
      minStep: 1,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY]
    }, 'Swap Usage')

    this.createCharacteristicClass('Reset', uuid('094'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE],
      adminOnlyAccess: [this.Access.WRITE]
    })

    this.createCharacteristicClass('CosmosEffect', uuid('095'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Cosmos')

    this.createCharacteristicClass('EnchantEffect', uuid('096'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Enchant')

    this.createCharacteristicClass('SunbeamEffect', uuid('097'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Sunbeam')

    this.createCharacteristicClass('UnderwaterEffect', uuid('098'), {
      format: this.Formats.BOOL,
      perms: [this.Perms.PAIRED_READ, this.Perms.NOTIFY, this.Perms.PAIRED_WRITE]
    }, 'Underwater')

    // Characteristic for Unique ID, used by homebridge-hue.
    // Source: as exposed by the Philips Hue bridge.  This characteristic is
    // used by the Hue app to select the accessories when syncing Hue bridge
    // Room groups to HomeKit rooms.
    // Its value is the `uniqueid` value.
    this.createCharacteristicClass(
      'UniqueID', 'D8B76298-42E7-5FFD-B1D6-1782D9A1F936', {
        format: this.Formats.STRING,
        perms: [this.Perms.PAIRED_READ]
      }, 'Unique ID'
    )

    // Characteristic for CLIP ID.
    // Source: as exposed by the Philips Hue bridge.  This characteristic is
    // exposed by the Hue bridge on each service.
    // Its value is some UUID.
    this.createCharacteristicClass(
      'ClipID', '23B88013-D5E2-5300-9DF1-D51D90CADED9', {
        format: this.Formats.STRING,
        perms: [this.Perms.PAIRED_READ]
      }
    )

    // ===== Services ==========================================================

    /** @member MyHomeKitTypes#Services
      * @property {Class} Alarm - Service for an alarm clock.
      * <br>Used by: homebridge-zp.
      * @property {Class} DeconzGateway - Service for deCONZ gateway config.
      * <br>Used by homebridge-deconz.
      * @property {Class} DeconzDevice - Service for config of device exposed
      * by deCONZ gateway.
      * <br>Used by homebridge-deconz.
      * @property {Class} HueBridge - Service for a Hue bridge.
      * <br>Used by: homebridge-hue for a Hue bridge or deCONZ gateway.
      * @property {Class} Resource - Generic service for resource.
      * <br>Used by: homebridge-hue for a schedule or rule.
      * @property {Class} Sonos - Service for a Sonos zone group.
      * <br>Used by: homebridge-zp.
      * @property {Class} Speaker - Service for a Sonos zone.
      * <br>Used by: homebridge-zp.
      * @property {Class} Status - Status service.
      * <br>Used by: homebridge-hue for a CLIPGenericStatus sensor.
      */

    this.createServiceClass('Resource', uuid('011'), [], [
      this.Characteristics.LastTriggered,
      this.Characteristics.TimesTriggered,
      this.hapCharacteristics.StatusActive,
      this.Characteristics.Enabled,
      this.Characteristics.Resource
    ])

    this.createServiceClass('HueBridge', uuid('012'), [
      this.Characteristics.Heartrate,
      this.Characteristics.LastUpdated,
      this.Characteristics.TransitionTime
    ], [
      this.Characteristics.Link,
      this.Characteristics.Restart,
      this.Characteristics.Touchlink
    ])

    this.createServiceClass('Status', uuid('013'), [
      this.Characteristics.Status
    ])

    this.createServiceClass('DeconzGateway', uuid('014'), [
      this.Characteristics.LastUpdated,
      this.hapCharacteristics.StatusActive,
      this.Characteristics.TransitionTime
    ])

    this.createServiceClass('DeconzDevice', uuid('015'), [
      this.Characteristics.Expose,
      this.Characteristics.Resource
    ])

    this.createServiceClass('Alarm', uuid('048'), [
      this.Characteristics.Enabled,
      this.Characteristics.CurrentTrack,
      this.Characteristics.Time
    ])

    this.createServiceClass('Sonos', this.hapServices.Switch.UUID, [
      this.hapCharacteristics.On,
      this.hapCharacteristics.Volume,
      this.Characteristics.ChangeVolume,
      this.hapCharacteristics.Mute,
      this.Characteristics.CurrentTrack,
      this.Characteristics.ChangeTrack,
      this.Characteristics.Repeat,
      this.Characteristics.Shuffle,
      this.Characteristics.SonosGroup,
      this.Characteristics.SonosCoordinator
    ], [
      this.Characteristics.Tv
    ])

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

export { MyHomeKitTypes }
