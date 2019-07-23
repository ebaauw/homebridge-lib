// homebridge-lib/doc/hap-nodejs.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2019 Erik Baauw. All rights reserved.

'use strict'

/* eslint-disable */

// Following "code" is just for generating documentation references for the
// hap-nodejs classes used by homebridge-lib.

/** Class for a HomeKit accessory.
  *
  * From {@link module:hap-nodejs hap-nodejs}.
  *
  * A HomeKit accessory is a physical device, exposed to HomeKit.
  * It contains one or more logical devices, or HomeKit services
  * (see {@link Service}).
  *
  * Plugins don't need to instantiate `Accessory` themselves.
  * The corresponding {@link AccessoryDelegate} takes care of this, through
  * {@link PlatformAccessory}.
  *
  * @class
  * @hideconstructor
  * @see https://github.com/KhaosT/HAP-NodeJS/lib/Accessory.js
  */
class Accessory {
  /** Homekit accessory category.
    *
    * HomeKit uses the category to display the appropriate icon when
    * adding newly discovered accessories.
    * The category doesn't seem to be used after the accessory has been paired.
    * @typedef
    */
  static get Category () {}

  /** Valid HomeKit accessory categories.
    *
    * Plugins access these through {@link Delegate#Accessory}
    *
    * @type {Object}
    * @property {Category} OTHER
    * @property {Category} BRIDGE
    * @property {Category} FAN
    * @property {Category} GARAGE_DOOR_OPENER
    * @property {Category} LIGHTBULB
    * @property {Category} DOOR_LOCK
    * @property {Category} OUTLET
    * @property {Category} SWITCH
    * @property {Category} THERMOSTAT
    * @property {Category} SENSOR
    * @property {Category} SECURITY_SYSTEM
    * @property {Category} DOOR
    * @property {Category} WINDOW
    * @property {Category} WINDOW_COVERING
    * @property {Category} PROGRAMMABLE_SWITCH
    * @property {Category} RANGE_EXTENDER
    * @property {Category} IP_CAMERA
    * @property {Category} VIDEO_DOORBELL
    * @property {Category} AIR_PURIFIER
    * @property {Category} AIR_HEATER
    * @property {Category} AIR_CONDITIONER
    * @property {Category} AIR_HUMIDIFIER
    * @property {Category} AIR_DEHUMIDIFIER
    * @property {Category} APPLE_TV
    * @property {Category} SPEAKER
    * @property {Category} AIRPORT
    * @property {Category} SPRINKLER
    * @property {Category} FAUCET
    * @property {Category} SHOWER_HEAD
    * @property {Category} TELEVISION
    * @property {Category} TARGET_CONTROLLER
    */
  static get Categories () {}
}

/** Abstract superclass for a HomeKit service.
  *
  * From {@link module:hap-nodejs hap-nodejs}.
  *
  * A HomeKit service is a logical device, exposed to HomeKit.
  * It belongs to a HomeKit accessory (see {@link Accessory}).
  * It contains or more attributes, or HomeKit characteristics
  * (see {@link Characteristic}).
  *
  * Most HomeKit apps, including Apple's Home app and Siri, show services,
  * even when they inappropriately label these as accessories.
  *
  * Each HomeKit service type corresponds to a different subclass of `Service`.
  * Plugins access the subclasses for pre-defined HomeKit service types
  * through {@Link Delegate#Services}.
  *
  * Plugins can create subclasses for other custom HomeKit service types
  * through {@link CustomHomeKitTypes#createServiceClass}.
  *
  * Plugins don't need to instantiate `Service` subclasses themselves.
  * The corresponding {@link ServiceDelegate} takes care of this.
  *
  * @class
  * @abstract
  * @hideconstructor
  * @see https://github.com/KhaosT/HAP-NodeJS/lib/Service.js
  */
class Service {}

/** Abstract superclass for a HomeKit characteristic.
  *
  * From {@link module:hap-nodejs hap-nodejs}.
  *
  * A HomeKit characteristic is a device attribute, exposed to HomeKit.
  * It belongs to a HomeKit service (see {@link Service}), which, in turn,
  * belongs to a HomeKit accessory (see {@link Accessory}).
  *
  * Each HomeKit characteristic type corresponds to a different subclass of
  * `Characteristic`.
  * Plugins access the subclasses for pre-defined HomeKit characteristic types
  * through {@link Delegate#Characteristics}.
  *
  * Plugins can create subclasses for other custom characteristic types
  * through {@link CustomHomeKitTypes#createCharacteristicClass}
  *
  * Plugins don't need to instantiate `Characteristic` subclasses themselves.
  * The corresponding {@link CharacteristicDelegate} takes care of this.
  *
  * @class
  * @abstract
  * @hideconstructor
  * @see https://github.com/KhaosT/HAP-NodeJS/lib/Characteristic.js
  */
class Characteristic {
  /** HomeKit characteristic format.
    *
    * The format determines what type of values the characteristic can hold.
    * @typedef
    */
  static get Format () {}

  /** Valid HomeKit characteristic formats.
    *
    * Plugins access these through {@link Delegate#Characteristic}
    *
    * @type {Object}
    * @property {Format} BOOL - Boolean.
    * @property {Format} UINT8 - Unsigned 8-bit integer.
    * @property {Format} UINT16 - Unsigned 16-bit integer.
    * @property {Format} UINT32 - Unsigned 32-bit integer.
    * @property {Format} UINT64 - Unsigned 64-bit integer.
    * @property {Format} INT - Signed 32-bit integer.
    * @property {Format} FLOAT - Signed 64-bit floating point number.
    * @property {Format} STRING - Sequence of zero or more Unicode characters,
    * encoded as UTF-8.
    * @property {Format} TLV8 - Base64-encoded set of one or more TLV8s.
    * @property {Format} DATA - Base64-encoded data blob
    */
  static get Formats () {}

  /** HomeKit characteristic permission.
    *
    * A permission defines what operations are allowed on the characteristic.
    * @typedef
    */
  static get Perm () {}

  /** Valid HomeKit characteristic permissions.
    *
    * Plugins access these through {@link Delegate#Characteristic}
    *
    * @type {Object}
    * @property {Perm} PAIRED_READ - Paired Read.
    * @property {Perm} READ - Paired Read.
    * @property {Perm} PAIRED_WRITE - Paired Write.
    * @property {Perm} WRITE - Paired Write.
    * @property {Perm} EVENTS - Events.
    * @property {Perm} NOTIFY - Events.
    * @property {Perm} ADDITIONAL_AUTHORIZATION - Additional Authorization.
    * @property {Perm} HIDDEN - Hidden.
    * @property {Perm} WRITE_RESPONSE - Write Response.
    */
  static get Perms () {}

  /** HomeKit characteristic properties.
    *
    * When defining a custom characteristic type, plugins pass the default
    * properties to {@link CustomHomeKitTypes#createCharacteristicClass}.
    *
    * When instantiating a characteristic type, plugins pass additional
    * properties to {@link ServiceDelegate#addCharacteristicDelegate}.
    *
    * @typedef {Object}
    * @property {Format} format - Format.
    * @property {Unit|string} unit - Unit.
    * @property {Perm[]} perms - Permissions.
    * @property {?string} description - Description.
    * @property {?number} minValue - Minimum value, for numeric formats.
    * @property {?number} maxValue - Maximum value, for numeric formats.
    * @property {?number} minStep - Smallest allowed increment,
    * for numeric formats.
    * @property {?number} [maxLen=64] - Maximum length,
    * for `Formats.STRING` format.
    * @property {?number} [maxDataLen=2097152]: Maximum length,
    * for `Formats.DATA` format.
    * @property {?number[]} valid-values - Valid values, for numeric formats.
    * @property {Array<number,number>} valid-values-range - Ranges of valid values,
    * for numeric formats.
    */
    static get Properties () {}

  /** HomeKit characteristic unit.
    *
    * The unit defines the unit of the characteristic value.
    * @typedef {string}
    */
  static get Unit () {}

  /** Standard HomeKit characteristic units.
    *
    * Plugins access these through {@link Delegate#Characteristic}
    *
    * @type {Object}
    * @property {Unit} CELSIUS - Degrees Celsius
    * @property {Unit} PERCENTAGE - Percentage
    * @property {Unit} ARC_DEGREE - Arc degrees
    * @property {Unit} LUX - Lux
    * @property {Unit} SECONDS - Seconds
    */
    static get Units () {}
}

/** HomeKit Accessory Protocol.
  *
  * HAP-NodeJS by Khaos Tian is a NodeJS implementation of Apple's
  * HomeKit Accessory Protocol (HAP).
  * This protocol defines the communication between HomeKit and HomeKit
  * accessories.
  * Note that HomeKit apps communicate with HomeKit in a different way,
  * defined by the HomeKit Framework, available only on iOS.
  *
  * HAP-NodeJS is the foundation underneath Homebridge.
  *
  * `homebridge-lib` handles most of the interaction with homebridge and
  * HAP-NodeJS.
  * Plugins do need to be aware of the following HAP-NodeJS classes:
  *
  * @module hap-nodejs
  * @property {Class} Accessory - Class for a HomeKit accessory.
  * <br>See {@link Accessory}.
  * @property {Class} Service - Abstract superclass for a HomeKit service.
  * <br>See {@link Service}.
  * @property {Object} Services - {@link Service} subclasses
  * for standard HomeKit service types.
  * @property {Class} Services.AccessoryInformation
  * @property {Class} Services.AirPurifier
  * @property {Class} Services.AirQualitySensor
  * @property {Class} Services.BatteryService
  * @property {Class} Services.BridgeConfiguration
  * @property {Class} Services.BridgingState
  * @property {Class} Services.CameraControl
  * @property {Class} Services.CameraRTPStreamManagement
  * @property {Class} Services.CarbonDioxideSensor
  * @property {Class} Services.CarbonMonoxideSensor
  * @property {Class} Services.ContactSensor
  * @property {Class} Services.Door
  * @property {Class} Services.Doorbell
  * @property {Class} Services.Fan
  * @property {Class} Services.Fanv2
  * @property {Class} Services.Faucet
  * @property {Class} Services.FilterMaintenance
  * @property {Class} Services.GarageDoorOpener
  * @property {Class} Services.HeaterCooler
  * @property {Class} Services.HumidifierDehumidifier
  * @property {Class} Services.HumiditySensor
  * @property {Class} Services.InputSource
  * @property {Class} Services.IrrigationSystem
  * @property {Class} Services.LeakSensor
  * @property {Class} Services.LightSensor
  * @property {Class} Services.Lightbulb
  * @property {Class} Services.LockManagement
  * @property {Class} Services.LockMechanism
  * @property {Class} Services.Microphone
  * @property {Class} Services.MotionSensor
  * @property {Class} Services.OccupancySensor
  * @property {Class} Services.Outlet
  * @property {Class} Services.Pairing
  * @property {Class} Services.ProtocolInformation
  * @property {Class} Services.Relay
  * @property {Class} Services.SecuritySystem
  * @property {Class} Services.ServiceLabel
  * @property {Class} Services.Slat
  * @property {Class} Services.SmokeSensor
  * @property {Class} Services.Speaker
  * @property {Class} Services.StatefulProgrammableSwitch
  * @property {Class} Services.StatelessProgrammableSwitch
  * @property {Class} Services.Switch
  * @property {Class} Services.Television
  * @property {Class} Services.TelevisionSpeaker
  * @property {Class} Services.TemperatureSensor
  * @property {Class} Services.Thermostat
  * @property {Class} Services.TimeInformation
  * @property {Class} Services.TunneledBTLEAccessoryService
  * @property {Class} Services.Valve
  * @property {Class} Services.Window
  * @property {Class} Services.WindowCovering
  * @property {Class} Characteristic - Abstract superclass for a HomeKit
  * characteristic.
  * <br>See {@link Characteristic}
  * @property {Object} Characteristics - {@link Characteristic} subclasses for
  * standard HomeKit characteristic types.
  * @property {Class} Characteristics.AccessoryFlags
  * @property {Class} Characteristics.AccessoryIdentifier
  * @property {Class} Characteristics.Active
  * @property {Class} Characteristics.ActiveIdentifier
  * @property {Class} Characteristics.AdministratorOnlyAccess
  * @property {Class} Characteristics.AirParticulateDensity
  * @property {Class} Characteristics.AirParticulateSize
  * @property {Class} Characteristics.AirQuality
  * @property {Class} Characteristics.AppMatchingIdentifier
  * @property {Class} Characteristics.AudioFeedback
  * @property {Class} Characteristics.BatteryLevel
  * @property {Class} Characteristics.Brightness
  * @property {Class} Characteristics.CarbonDioxideDetected
  * @property {Class} Characteristics.CarbonDioxideLevel
  * @property {Class} Characteristics.CarbonDioxidePeakLevel
  * @property {Class} Characteristics.CarbonMonoxideDetected
  * @property {Class} Characteristics.CarbonMonoxideLevel
  * @property {Class} Characteristics.CarbonMonoxidePeakLevel
  * @property {Class} Characteristics.Category
  * @property {Class} Characteristics.ChargingState
  * @property {Class} Characteristics.ClosedCaptions
  * @property {Class} Characteristics.ColorTemperature
  * @property {Class} Characteristics.ConfigureBridgedAccessory
  * @property {Class} Characteristics.ConfigureBridgedAccessoryStatus
  * @property {Class} Characteristics.ConfiguredName
  * @property {Class} Characteristics.ContactSensorState
  * @property {Class} Characteristics.CoolingThresholdTemperature
  * @property {Class} Characteristics.CurrentAirPurifierState
  * @property {Class} Characteristics.CurrentAmbientLightLevel
  * @property {Class} Characteristics.CurrentDoorState
  * @property {Class} Characteristics.CurrentFanState
  * @property {Class} Characteristics.CurrentHeaterCoolerState
  * @property {Class} Characteristics.CurrentHeatingCoolingState
  * @property {Class} Characteristics.CurrentHorizontalTiltAngle
  * @property {Class} Characteristics.CurrentHumidifierDehumidifierState
  * @property {Class} Characteristics.CurrentMediaState
  * @property {Class} Characteristics.CurrentPosition
  * @property {Class} Characteristics.CurrentRelativeHumidity
  * @property {Class} Characteristics.CurrentSlatState
  * @property {Class} Characteristics.CurrentTemperature
  * @property {Class} Characteristics.CurrentTiltAngle
  * @property {Class} Characteristics.CurrentTime
  * @property {Class} Characteristics.CurrentVerticalTiltAngle
  * @property {Class} Characteristics.CurrentVisibilityState
  * @property {Class} Characteristics.DayoftheWeek
  * @property {Class} Characteristics.DigitalZoom
  * @property {Class} Characteristics.DiscoverBridgedAccessories
  * @property {Class} Characteristics.DiscoveredBridgedAccessories
  * @property {Class} Characteristics.DisplayOrder
  * @property {Class} Characteristics.FilterChangeIndication
  * @property {Class} Characteristics.FilterLifeLevel
  * @property {Class} Characteristics.FirmwareRevision
  * @property {Class} Characteristics.HardwareRevision
  * @property {Class} Characteristics.HeatingThresholdTemperature
  * @property {Class} Characteristics.HoldPosition
  * @property {Class} Characteristics.Hue
  * @property {Class} Characteristics.Identifier
  * @property {Class} Characteristics.Identify
  * @property {Class} Characteristics.ImageMirroring
  * @property {Class} Characteristics.ImageRotation
  * @property {Class} Characteristics.InUse
  * @property {Class} Characteristics.InputDeviceType
  * @property {Class} Characteristics.InputSourceType
  * @property {Class} Characteristics.IsConfigured
  * @property {Class} Characteristics.LeakDetected
  * @property {Class} Characteristics.LinkQuality
  * @property {Class} Characteristics.LockControlPoint
  * @property {Class} Characteristics.LockCurrentState
  * @property {Class} Characteristics.LockLastKnownAction
  * @property {Class} Characteristics.LockManagementAutoSecurityTimeout
  * @property {Class} Characteristics.LockPhysicalControls
  * @property {Class} Characteristics.LockTargetState
  * @property {Class} Characteristics.Logs
  * @property {Class} Characteristics.Manufacturer
  * @property {Class} Characteristics.Model
  * @property {Class} Characteristics.MotionDetected
  * @property {Class} Characteristics.Mute
  * @property {Class} Characteristics.Name
  * @property {Class} Characteristics.NightVision
  * @property {Class} Characteristics.NitrogenDioxideDensity
  * @property {Class} Characteristics.ObstructionDetected
  * @property {Class} Characteristics.OccupancyDetected
  * @property {Class} Characteristics.On
  * @property {Class} Characteristics.OpticalZoom
  * @property {Class} Characteristics.OutletInUse
  * @property {Class} Characteristics.OzoneDensity
  * @property {Class} Characteristics.PM10Density
  * @property {Class} Characteristics.PM2_5Density
  * @property {Class} Characteristics.PairSetup
  * @property {Class} Characteristics.PairVerify
  * @property {Class} Characteristics.PairingFeatures
  * @property {Class} Characteristics.PairingPairings
  * @property {Class} Characteristics.PictureMode
  * @property {Class} Characteristics.PositionState
  * @property {Class} Characteristics.PowerModeSelection
  * @property {Class} Characteristics.ProgramMode
  * @property {Class} Characteristics.ProgrammableSwitchEvent
  * @property {Class} Characteristics.ProgrammableSwitchOutputState
  * @property {Class} Characteristics.Reachable
  * @property {Class} Characteristics.RelativeHumidityDehumidifierThreshold
  * @property {Class} Characteristics.RelativeHumidityHumidifierThreshold
  * @property {Class} Characteristics.RelayControlPoint
  * @property {Class} Characteristics.RelayEnabled
  * @property {Class} Characteristics.RelayState
  * @property {Class} Characteristics.RemainingDuration
  * @property {Class} Characteristics.RemoteKey
  * @property {Class} Characteristics.ResetFilterIndication
  * @property {Class} Characteristics.RotationDirection
  * @property {Class} Characteristics.RotationSpeed
  * @property {Class} Characteristics.Saturation
  * @property {Class} Characteristics.SecuritySystemAlarmType
  * @property {Class} Characteristics.SecuritySystemCurrentState
  * @property {Class} Characteristics.SecuritySystemTargetState
  * @property {Class} Characteristics.SelectedRTPStreamConfiguration
  * @property {Class} Characteristics.SerialNumber
  * @property {Class} Characteristics.ServiceLabelIndex
  * @property {Class} Characteristics.ServiceLabelNamespace
  * @property {Class} Characteristics.SetDuration
  * @property {Class} Characteristics.SetupEndpoints
  * @property {Class} Characteristics.SlatType
  * @property {Class} Characteristics.SleepDiscoveryMode
  * @property {Class} Characteristics.SmokeDetected
  * @property {Class} Characteristics.SoftwareRevision
  * @property {Class} Characteristics.StatusActive
  * @property {Class} Characteristics.StatusFault
  * @property {Class} Characteristics.StatusJammed
  * @property {Class} Characteristics.StatusLowBattery
  * @property {Class} Characteristics.StatusTampered
  * @property {Class} Characteristics.StreamingStatus
  * @property {Class} Characteristics.SulphurDioxideDensity
  * @property {Class} Characteristics.SupportedAudioStreamConfiguration
  * @property {Class} Characteristics.SupportedRTPConfiguration
  * @property {Class} Characteristics.SupportedVideoStreamConfiguration
  * @property {Class} Characteristics.SwingMode
  * @property {Class} Characteristics.TargetAirPurifierState
  * @property {Class} Characteristics.TargetAirQuality
  * @property {Class} Characteristics.TargetDoorState
  * @property {Class} Characteristics.TargetFanState
  * @property {Class} Characteristics.TargetHeaterCoolerState
  * @property {Class} Characteristics.TargetHeatingCoolingState
  * @property {Class} Characteristics.TargetHorizontalTiltAngle
  * @property {Class} Characteristics.TargetHumidifierDehumidifierState
  * @property {Class} Characteristics.TargetMediaState
  * @property {Class} Characteristics.TargetPosition
  * @property {Class} Characteristics.TargetRelativeHumidity
  * @property {Class} Characteristics.TargetSlatState
  * @property {Class} Characteristics.TargetTemperature
  * @property {Class} Characteristics.TargetTiltAngle
  * @property {Class} Characteristics.TargetVerticalTiltAngle
  * @property {Class} Characteristics.TargetVisibilityState
  * @property {Class} Characteristics.TemperatureDisplayUnits
  * @property {Class} Characteristics.TimeUpdate
  * @property {Class} Characteristics.TunnelConnectionTimeout
  * @property {Class} Characteristics.TunneledAccessoryAdvertising
  * @property {Class} Characteristics.TunneledAccessoryConnected
  * @property {Class} Characteristics.TunneledAccessoryStateNumber
  * @property {Class} Characteristics.VOCDensity
  * @property {Class} Characteristics.ValveType
  * @property {Class} Characteristics.Version
  * @property {Class} Characteristics.Volume
  * @property {Class} Characteristics.VolumeControlType
  * @property {Class} Characteristics.VolumeSelector
  * @property {Class} Characteristics.WaterLevel
  * @see https://github.com/KhaosT/HAP-NodeJS
  * @see https://developer.apple.com/homekit/
  */
class hapNodeJs {}

/* eslint-enable */