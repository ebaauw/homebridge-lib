// homebridge-lib/doc/hap-nodejs.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2024 Erik Baauw. All rights reserved.

'use strict'

/* eslint-disable */

// Following "code" is just for generating documentation references for the
// hap-nodejs classes used by homebridge-lib.

/** HomeKit accessory.
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
  * @see https://github.com/homebridge/HAP-NodeJS/blob/master/src/lib/Accessory.ts
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
    * @property {Category} HOMEPOD
    * @property {Category} SPEAKER
    * @property {Category} AIRPORT
    * @property {Category} SPRINKLER
    * @property {Category} FAUCET
    * @property {Category} SHOWER_HEAD
    * @property {Category} TELEVISION
    * @property {Category} TARGET_CONTROLLER
    * @property {Category} ROUTER
    * @property {Category} AUDIO_RECEIVER
    * @property {Category} TV_SET_TOP_BOX
    * @property {Category} TV_STREAMING_STICK
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
  * @see https://github.com/homebridge/HAP-NodeJS/blob/master/src/lib/Service.ts
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
  * @see https://github.com/homebridge/HAP-NodeJS/blob/master/src/lib/Characteristic.ts
  */
class Characteristic {
  /** HomeKit characteristic format.
    *
    * A permission that has been restricted to administrators.
    * @typedef
    */
  static get AccessPerm () {}

  /** HomeKit admin-only access.
    *
    * Plugins access these through {@link Delegate#Characteristic}.
    *
    * @type {Object}
    * @property {AccessPerm} READ - Read restricted to admins.
    * @property {AccessPerm} WRITE - Write restricted to admins.
    * @property {AccessPerm} NOTIFY - Notify restricted to admins.
    */
  static get Access () {}

  /** HomeKit characteristic format.
    *
    * The format determines what type of values the characteristic can hold.
    * @typedef
    */
  static get Format () {}

  /** Valid HomeKit characteristic formats.
    *
    * Plugins access these through {@link Delegate#Characteristic}.
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
    * Plugins access these through {@link Delegate#Characteristic}.
    *
    * @type {Object}
    * @property {Perm} PAIRED_READ - Paired Read.
    * @property {Perm} PAIRED_WRITE - Paired Write.
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
    * @property {Access[]} adminOnlyAccess - Admin-only permissions.
    * @property {?string} description - Description.
    * @property {?number} minValue - Minimum value, for numeric formats.
    * @property {?number} maxValue - Maximum value, for numeric formats.
    * @property {?number} minStep - Smallest allowed increment,
    * for numeric formats.
    * @property {?number} [maxLen=64] - Maximum length,
    * for `Formats.STRING` format.
    * @property {?number} [maxDataLen=2097152] - Maximum length,
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
    * Plugins access these through {@link Delegate#Characteristic}.
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

/** NodeJS implementation of a HomeKit Accessory Server.
  *
  * HAP-NodeJS by Khaos Tian is a NodeJS implementation of a HomeKit accessory.
  * It implements a web server that follows the HomeKit Accessory Protocol
  * (HAP).
  * This protocol defines the communication between HomeKit and HomeKit
  * accessories.
  * Note that HomeKit apps communicate with HomeKit in a different way,
  * defined by the HomeKit Framework, available only on iOS.
  *
  * HAP-NodeJS is the foundation underneath Homebridge.
  *
  * `homebridge-lib` handles most of the interaction with homebridge and
  * HAP-NodeJS.
  * Plugins do need to be aware of the HAP-NodeJS elements below.
  *
  * @module hap-nodejs
  * @see https://github.com/homebridge/HAP-NodeJS
  * @see https://developer.apple.com/homekit/
  */
class HapNodeJs {
  /** HomeKit accessory.
    * <br>See {@link Accessory}.
    * @type {Class}
    * @memberof module:hap-nodejs
    */
  static get Accessory () {}

  /** Abstract superclass for a HomeKit service.
    * <br>See {@link Service}.
    * @type {Class}
    * @memberof module:hap-nodejs
    */
  static get Service () {}

  /** Abstract superclass for a HomeKit characteristic.
    * <br>See {@link Characteristic}.
    * @type {Class}
    * @memberof module:hap-nodejs
    */
  static get Characteristic () {}

  /** {@link Service} subclasses for standard HomeKit service types.
    *
    * Plugins access these through {@link Delegate#Services}.
    *
    * @type {Object}
    * @memberof module:hap-nodejs
    * @property {Class} Services.AccessCode
    * @property {Class} Services.AccessControl
    * @property {Class} Services.AccessoryInformation
    * @property {Class} Services.AccessoryMetrics
    * @property {Class} Services.AccessoryRuntimeInformation
    * @property {Class} Services.AirPurifier
    * @property {Class} Services.AirQualitySensor
    * @property {Class} Services.AssetUpdate
    * @property {Class} Services.Assistant
    * @property {Class} Services.AudioStreamManagement
    * @property {Class} Services.Battery
    * @property {Class} Services.BridgeConfiguration
    * @property {Class} Services.BridgingState
    * @property {Class} Services.CameraControl
    * @property {Class} Services.CameraOperatingMode
    * @property {Class} Services.CameraRecordingManagement
    * @property {Class} Services.CameraRTPStreamManagement
    * @property {Class} Services.CarbonDioxideSensor
    * @property {Class} Services.CarbonMonoxideSensor
    * @property {Class} Services.CloudRelay
    * @property {Class} Services.ContactSensor
    * @property {Class} Services.DataStreamTransportManagement
    * @property {Class} Services.Diagnostics
    * @property {Class} Services.Door
    * @property {Class} Services.Doorbell
    * @property {Class} Services.Fan
    * @property {Class} Services.Fanv2
    * @property {Class} Services.Faucet
    * @property {Class} Services.FilterMaintenance
    * @property {Class} Services.FirmwareUpdate
    * @property {Class} Services.GarageDoorOpener
    * @property {Class} Services.HeaterCooler
    * @property {Class} Services.HumidifierDehumidifier
    * @property {Class} Services.HumiditySensor
    * @property {Class} Services.InputSource
    * @property {Class} Services.IrrigationSystem
    * @property {Class} Services.LeakSensor
    * @property {Class} Services.Lightbulb
    * @property {Class} Services.LightSensor
    * @property {Class} Services.LockManagement
    * @property {Class} Services.LockMechanism
    * @property {Class} Services.Microphone
    * @property {Class} Services.MotionSensor
    * @property {Class} Services.NFCAccess
    * @property {Class} Services.OccupancySensor
    * @property {Class} Services.Outlet
    * @property {Class} Services.Pairing
    * @property {Class} Services.PowerManagement
    * @property {Class} Services.ProtocolInformation
    * @property {Class} Services.SecuritySystem
    * @property {Class} Services.ServiceLabel
    * @property {Class} Services.Siri
    * @property {Class} Services.SiriEndpoint
    * @property {Class} Services.Slats
    * @property {Class} Services.SmartSpeaker
    * @property {Class} Services.SmokeSensor
    * @property {Class} Services.Speaker
    * @property {Class} Services.StatefulProgrammableSwitch
    * @property {Class} Services.StatelessProgrammableSwitch
    * @property {Class} Services.Switch
    * @property {Class} Services.TapManagement
    * @property {Class} Services.TargetControl
    * @property {Class} Services.TargetControlManagement
    * @property {Class} Services.Television
    * @property {Class} Services.TelevisionSpeaker
    * @property {Class} Services.TemperatureSensor
    * @property {Class} Services.Thermostat
    * @property {Class} Services.ThreadTransport
    * @property {Class} Services.TimeInformation
    * @property {Class} Services.TransferTransportManagement
    * @property {Class} Services.Tunnel
    * @property {Class} Services.Valve
    * @property {Class} Services.WiFiRouter
    * @property {Class} Services.WiFiSatellite
    * @property {Class} Services.WiFiTransport
    * @property {Class} Services.Window
    * @property {Class} Services.WindowCovering
    * @see https://github.com/homebridge/HAP-NodeJS/blob/master/src/lib/definitions/ServiceDefinitions.ts
    */
  static get Services () {}

  /** {@link Characteristic} subclasses for standard HomeKit
    * characteristic types.
    *
    * Plugins access these through {@link Delegate#Characteristics}.
    *
    * @type {Object}
    * @memberof module:hap-nodejs
    * @property {Class} Characteristics.AccessCodeControlPoint
    * @property {Class} Characteristics.AccessCodeSupportedConfiguration
    * @property {Class} Characteristics.AccessControlLevel
    * @property {Class} Characteristics.AccessoryFlags
    * @property {Class} Characteristics.AccessoryIdentifier
    * @property {Class} Characteristics.Active
    * @property {Class} Characteristics.ActiveIdentifier
    * @property {Class} Characteristics.ActivityInterval
    * @property {Class} Characteristics.AdministratorOnlyAccess
    * @property {Class} Characteristics.AirParticulateDensity
    * @property {Class} Characteristics.AirParticulateSize
    * @property {Class} Characteristics.AirPlayEnable
    * @property {Class} Characteristics.AirQuality
    * @property {Class} Characteristics.AppMatchingIdentifier
    * @property {Class} Characteristics.AssetUpdateReadiness
    * @property {Class} Characteristics.AudioFeedback
    * @property {Class} Characteristics.BatteryLevel
    * @property {Class} Characteristics.Brightness
    * @property {Class} Characteristics.ButtonEvent
    * @property {Class} Characteristics.CameraOperatingModeIndicator
    * @property {Class} Characteristics.CarbonDioxideDetected
    * @property {Class} Characteristics.CarbonDioxideLevel
    * @property {Class} Characteristics.CarbonDioxidePeakLevel
    * @property {Class} Characteristics.CarbonMonoxideDetected
    * @property {Class} Characteristics.CarbonMonoxideLevel
    * @property {Class} Characteristics.CarbonMonoxidePeakLevel
    * @property {Class} Characteristics.Category
    * @property {Class} Characteristics.CCAEnergyDetectThreshold
    * @property {Class} Characteristics.CCASignalDetectThreshold
    * @property {Class} Characteristics.CharacteristicValueActiveTransitionCount
    * @property {Class} Characteristics.CharacteristicValueTransitionControl
    * @property {Class} Characteristics.ChargingState
    * @property {Class} Characteristics.ClosedCaptions
    * @property {Class} Characteristics.ColorTemperature
    * @property {Class} Characteristics.ConfigurationState
    * @property {Class} Characteristics.ConfigureBridgedAccessory
    * @property {Class} Characteristics.ConfigureBridgedAccessoryStatus
    * @property {Class} Characteristics.ConfiguredName
    * @property {Class} Characteristics.ContactSensorState
    * @property {Class} Characteristics.CoolingThresholdTemperature
    * @property {Class} Characteristics.CryptoHash
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
    * @property {Class} Characteristics.CurrentTransport
    * @property {Class} Characteristics.CurrentVerticalTiltAngle
    * @property {Class} Characteristics.CurrentVisibilityState
    * @property {Class} Characteristics.DataStreamHAPTransport
    * @property {Class} Characteristics.DataStreamHAPTransportInterrupt
    * @property {Class} Characteristics.DayoftheWeek
    * @property {Class} Characteristics.DiagonalFieldOfView
    * @property {Class} Characteristics.DigitalZoom
    * @property {Class} Characteristics.DiscoverBridgedAccessories
    * @property {Class} Characteristics.DiscoveredBridgedAccessories
    * @property {Class} Characteristics.DisplayOrder
    * @property {Class} Characteristics.EventRetransmissionMaximum
    * @property {Class} Characteristics.EventSnapshotsActive
    * @property {Class} Characteristics.EventTransmissionCounters
    * @property {Class} Characteristics.FilterChangeIndication
    * @property {Class} Characteristics.FilterLifeLevel
    * @property {Class} Characteristics.FirmwareRevision
    * @property {Class} Characteristics.FirmwareUpdateReadiness
    * @property {Class} Characteristics.FirmwareUpdateStatus
    * @property {Class} Characteristics.HardwareFinish
    * @property {Class} Characteristics.HardwareRevision
    * @property {Class} Characteristics.HeartBeat
    * @property {Class} Characteristics.HeatingThresholdTemperature
    * @property {Class} Characteristics.HoldPosition
    * @property {Class} Characteristics.HomeKitCameraActive
    * @property {Class} Characteristics.Hue
    * @property {Class} Characteristics.Identifier
    * @property {Class} Characteristics.Identify
    * @property {Class} Characteristics.ImageMirroring
    * @property {Class} Characteristics.ImageRotation
    * @property {Class} Characteristics.InputDeviceType
    * @property {Class} Characteristics.InputSourceType
    * @property {Class} Characteristics.InUse
    * @property {Class} Characteristics.IsConfigured
    * @property {Class} Characteristics.LeakDetected
    * @property {Class} Characteristics.LinkQuality
    * @property {Class} Characteristics.ListPairings
    * @property {Class} Characteristics.LockControlPoint
    * @property {Class} Characteristics.LockCurrentState
    * @property {Class} Characteristics.LockLastKnownAction
    * @property {Class} Characteristics.LockManagementAutoSecurityTimeout
    * @property {Class} Characteristics.LockPhysicalControls
    * @property {Class} Characteristics.LockTargetState
    * @property {Class} Characteristics.Logs
    * @property {Class} Characteristics.MACRetransmissionMaximum
    * @property {Class} Characteristics.MACTransmissionCounters
    * @property {Class} Characteristics.ManagedNetworkEnable
    * @property {Class} Characteristics.ManuallyDisabled
    * @property {Class} Characteristics.Manufacturer
    * @property {Class} Characteristics.MaximumTransmitPower
    * @property {Class} Characteristics.MetricsBufferFullState
    * @property {Class} Characteristics.Model
    * @property {Class} Characteristics.MotionDetected
    * @property {Class} Characteristics.MultifunctionButton
    * @property {Class} Characteristics.Mute
    * @property {Class} Characteristics.Name
    * @property {Class} Characteristics.NetworkAccessViolationControl
    * @property {Class} Characteristics.NetworkClientProfileControl
    * @property {Class} Characteristics.NetworkClientStatusControl
    * @property {Class} Characteristics.NFCAccessControlPoint
    * @property {Class} Characteristics.NFCAccessSupportedConfiguration
    * @property {Class} Characteristics.NightVision
    * @property {Class} Characteristics.NitrogenDioxideDensity
    * @property {Class} Characteristics.ObstructionDetected
    * @property {Class} Characteristics.OccupancyDetected
    * @property {Class} Characteristics.On
    * @property {Class} Characteristics.OperatingStateResponse
    * @property {Class} Characteristics.OpticalZoom
    * @property {Class} Characteristics.OutletInUse
    * @property {Class} Characteristics.OzoneDensity
    * @property {Class} Characteristics.PairingFeatures
    * @property {Class} Characteristics.PairSetup
    * @property {Class} Characteristics.PairVerify
    * @property {Class} Characteristics.PasswordSetting
    * @property {Class} Characteristics.PeriodicSnapshotsActive
    * @property {Class} Characteristics.PictureMode
    * @property {Class} Characteristics.Ping
    * @property {Class} Characteristics.PM10Density
    * @property {Class} Characteristics.PM2_5Density
    * @property {Class} Characteristics.PositionState
    * @property {Class} Characteristics.PowerModeSelection
    * @property {Class} Characteristics.ProductData
    * @property {Class} Characteristics.ProgrammableSwitchEvent
    * @property {Class} Characteristics.ProgrammableSwitchOutputState
    * @property {Class} Characteristics.ProgramMode
    * @property {Class} Characteristics.Reachable
    * @property {Class} Characteristics.ReceivedSignalStrengthIndication
    * @property {Class} Characteristics.ReceiverSensitivity
    * @property {Class} Characteristics.RecordingAudioActive
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
    * @property {Class} Characteristics.RouterStatus
    * @property {Class} Characteristics.Saturation
    * @property {Class} Characteristics.SecuritySystemAlarmType
    * @property {Class} Characteristics.SecuritySystemCurrentState
    * @property {Class} Characteristics.SecuritySystemTargetState
    * @property {Class} Characteristics.SelectedAudioStreamConfiguration
    * @property {Class} Characteristics.SelectedCameraRecordingConfiguration
    * @property {Class} Characteristics.SelectedDiagnosticsModes
    * @property {Class} Characteristics.SelectedRTPStreamConfiguration
    * @property {Class} Characteristics.SelectedSleepConfiguration
    * @property {Class} Characteristics.SerialNumber
    * @property {Class} Characteristics.ServiceLabelIndex
    * @property {Class} Characteristics.ServiceLabelNamespace
    * @property {Class} Characteristics.SetDuration
    * @property {Class} Characteristics.SetupDataStreamTransport
    * @property {Class} Characteristics.SetupEndpoints
    * @property {Class} Characteristics.SetupTransferTransport
    * @property {Class} Characteristics.SignalToNoiseRatio
    * @property {Class} Characteristics.SiriEnable
    * @property {Class} Characteristics.SiriEndpointSessionStatus
    * @property {Class} Characteristics.SiriEngineVersion
    * @property {Class} Characteristics.SiriInputType
    * @property {Class} Characteristics.SiriLightOnUse
    * @property {Class} Characteristics.SiriListening
    * @property {Class} Characteristics.SiriTouchToUse
    * @property {Class} Characteristics.SlatType
    * @property {Class} Characteristics.SleepDiscoveryMode
    * @property {Class} Characteristics.SleepInterval
    * @property {Class} Characteristics.SmokeDetected
    * @property {Class} Characteristics.SoftwareRevision
    * @property {Class} Characteristics.StagedFirmwareVersion
    * @property {Class} Characteristics.StatusActive
    * @property {Class} Characteristics.StatusFault
    * @property {Class} Characteristics.StatusJammed
    * @property {Class} Characteristics.StatusLowBattery
    * @property {Class} Characteristics.StatusTampered
    * @property {Class} Characteristics.StreamingStatus
    * @property {Class} Characteristics.SulphurDioxideDensity
    * @property {Class} Characteristics.SupportedAssetTypes
    * @property {Class} Characteristics.SupportedAudioRecordingConfiguration
    * @property {Class} Characteristics.SupportedAudioStreamConfiguration
    * @property {Class} Characteristics.SupportedCameraRecordingConfiguration
    * @property {Class} Characteristics.SupportedCharacteristicValueTransitionConfiguration
    * @property {Class} Characteristics.SupportedDataStreamTransportConfiguration
    * @property {Class} Characteristics.SupportedDiagnosticsModes
    * @property {Class} Characteristics.SupportedDiagnosticsSnapshot
    * @property {Class} Characteristics.SupportedFirmwareUpdateConfiguration
    * @property {Class} Characteristics.SupportedMetrics
    * @property {Class} Characteristics.SupportedRouterConfiguration
    * @property {Class} Characteristics.SupportedRTPConfiguration
    * @property {Class} Characteristics.SupportedSleepConfiguration
    * @property {Class} Characteristics.SupportedTransferTransportConfiguration
    * @property {Class} Characteristics.SupportedVideoRecordingConfiguration
    * @property {Class} Characteristics.SupportedVideoStreamConfiguration
    * @property {Class} Characteristics.SwingMode
    * @property {Class} Characteristics.TapType
    * @property {Class} Characteristics.TargetAirPurifierState
    * @property {Class} Characteristics.TargetAirQuality
    * @property {Class} Characteristics.TargetControlList
    * @property {Class} Characteristics.TargetControlSupportedConfiguration
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
    * @property {Class} Characteristics.ThirdPartyCameraActive
    * @property {Class} Characteristics.ThreadControlPoint
    * @property {Class} Characteristics.ThreadNodeCapabilities
    * @property {Class} Characteristics.ThreadOpenThreadVersion
    * @property {Class} Characteristics.ThreadStatus
    * @property {Class} Characteristics.TimeUpdate
    * @property {Class} Characteristics.Token
    * @property {Class} Characteristics.TransmitPower
    * @property {Class} Characteristics.TunnelConnectionTimeout
    * @property {Class} Characteristics.TunneledAccessoryAdvertising
    * @property {Class} Characteristics.TunneledAccessoryConnected
    * @property {Class} Characteristics.TunneledAccessoryStateNumber
    * @property {Class} Characteristics.ValveType
    * @property {Class} Characteristics.Version
    * @property {Class} Characteristics.VideoAnalysisActive
    * @property {Class} Characteristics.VOCDensity
    * @property {Class} Characteristics.Volume
    * @property {Class} Characteristics.VolumeControlType
    * @property {Class} Characteristics.VolumeSelector
    * @property {Class} Characteristics.WakeConfiguration
    * @property {Class} Characteristics.WANConfigurationList
    * @property {Class} Characteristics.WANStatusList
    * @property {Class} Characteristics.WaterLevel
    * @property {Class} Characteristics.WiFiCapabilities
    * @property {Class} Characteristics.WiFiConfigurationControl
    * @property {Class} Characteristics.WiFiSatelliteStatus
    * @see https://github.com/homebridge/HAP-NodeJS/blob/master/src/lib/definitions/CharacteristicDefinitions.ts
    */
  static get Characteristics () {}
}

/* eslint-enable */
