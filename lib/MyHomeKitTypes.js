// homebridge-lib/lib/MyHomeKitTypes.js
//
// Library for homebridge plug-ins.
// Copyright © 2017,2018 Erik Baauw. All rights reserved.
//
// My own collection of custom HomeKit Services and Characteristics.

const homebridgeLib = require('../index')

let hap
const my = {
  Service: {},
  Characteristic: {},
  uuid: (id) => {
    if (typeof id !== 'string' || id.length !== 3) {
      throw new TypeError(`${id}: illegal id`)
    }
    return `00000${id}-0000-1000-8000-656261617577`
  }
}

module.exports = class MyHomeKitTypes extends homebridgeLib.CustomHomeKitTypes {
  constructor (homebridge) {
    super(homebridge, my)
    hap = homebridge.hap

    // ===== Characteristics ===================================================

    // Used by homebridge-hue.
    this.createCharacteristic('Resource', my.uuid('021'), {
      format: this.formats.STRING,
      perms: [this.perms.READ]
    })

    // Used by homebridge-hue.
    this.createCharacteristic('Enabled', my.uuid('022'), {
      format: this.formats.BOOL,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    })

    // Used by homebridge-hue.
    this.createCharacteristic('LastUpdated', my.uuid('023'), {
      format: this.formats.STRING,
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Last Updated')

    // Used by homebridge-hue in HueBridge service.
    this.createCharacteristic('Heartrate', my.uuid('024'), {
      format: this.formats.UINT8,
      unit: this.units.SECONDS,
      minValue: 1,
      maxValue: 30,
      minStep: 1,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    })

    // Used by homebridge-hue in LightSensor service.
    this.createCharacteristic('Dark', my.uuid('025'), {
      format: this.formats.BOOL,
      perms: [this.perms.READ, this.perms.NOTIFY]
    })

    // Used by homebridge-hue in LightSensor service.
    this.createCharacteristic('Daylight', my.uuid('026'), {
      format: this.formats.BOOL,
      perms: [this.perms.READ, this.perms.NOTIFY]
    })

    // Used by homebridge-hue in Status service.
    this.createCharacteristic('Status', my.uuid('027'), {
      format: this.formats.INT,
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
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    })

    // Used by homebridge-hue in for group LightBulb or Switch service.
    this.createCharacteristic('AnyOn', my.uuid('028'), {
      format: this.formats.BOOL,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE
      ]
    })

    // Used by homebridge-hue in Resource service.
    this.createCharacteristic('LastTriggered', my.uuid('029'), {
      format: this.formats.STRING,
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Last Triggered')

    // Used by homebridge-hue in Resource service.
    this.createCharacteristic('TimesTriggered', my.uuid('02A'), {
      format: this.formats.INT,
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Times Triggered')

    // Used by homebridge-hue in MotionSensor service.
    // Deprecated in favour of Eve's Sensitivity characteristic.
    this.createCharacteristic('Sensitivity', my.uuid('02B'), {
      format: this.formats.UINT8,
      minValue: 0,
      maxValue: 127,
      minStep: 1,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    })

    // Used by homebridge-hue in MotionSensor service.
    // Deprecated in favour of Eve's Durarion characteristic.
    this.createCharacteristic('Duration', my.uuid('02C'), {
      format: this.formats.UINT16,
      unit: this.units.SECONDS,
      minValue: 0,
      maxValue: 7200,
      minStep: 1,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    })

    // Used by homebridge-hue in HueBridge service.
    this.createCharacteristic('Link', my.uuid('02D'), {
      format: this.formats.BOOL,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    })

    // Used by homebridge-hue in HueBridge service.
    this.createCharacteristic('Touchlink', my.uuid('02E'), {
      format: this.formats.BOOL,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    })

    // Used by homebridge-hue in HueBridge service.
    this.createCharacteristic('TransitionTime', my.uuid('02F'), {
      format: this.formats.FLOAT,
      unit: this.units.SECONDS,
      minValue: 0,
      maxValue: 3600,
      minStep: 0.1,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    }, 'Transition Time')

    // Used by homebridge-hue in Temperature service.
    this.createCharacteristic('Offset', my.uuid('030'), {
      format: this.formats.FLOAT,
      unit: this.units.CELSIUS,
      maxValue: 5,
      minValue: -5,
      minStep: 0.1,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    })

    // Used by homebridge-p1 in Electricity service.
    this.createCharacteristic('Tariff', my.uuid('031'), {
      format: this.formats.STRING,
      perms: [this.perms.READ, this.perms.NOTIFY]
    })

    // Used by homebridge-hue for Alarm service.
    this.createCharacteristic('Alarm', my.uuid('032'), {
      format: this.formats.BOOL,
      perms: [this.perms.READ, this.perms.NOTIFY]
    })

    // Used by homebridge-hue for Daylight sensor.
    this.createCharacteristic('Period', my.uuid('033'), {
      format: this.formats.STRING,
      perms: [this.perms.READ, this.perms.NOTIFY]
    })

    // Used by homebridge-hue for Daylight sensor.
    this.createCharacteristic('LastEvent', my.uuid('034'), {
      format: this.formats.STRING,
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Last Event')

    // Used by homebridge-zp in Speaker service.
    this.createCharacteristic('Bass', my.uuid('041'), {
      format: this.formats.INT,
      minValue: -10,
      maxValue: 10,
      minStep: 1,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    })

    // Used by homebridge-zp in Speaker service.
    this.createCharacteristic('Treble', my.uuid('042'), {
      format: this.formats.INT,
      minValue: -10,
      maxValue: 10,
      minStep: 1,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    })

    // Used by homebridge-zp in Speaker service.
    this.createCharacteristic('Loudness', my.uuid('043'), {
      format: this.formats.BOOL,
      perms: [this.perms.READ, this.perms.NOTIFY,
        this.perms.WRITE]
    })

    // Used by homebridge-zp in Speaker service.
    this.createCharacteristic('Balance', my.uuid('044'), {
      format: this.formats.INT,
      minValue: -10,
      maxValue: 10,
      minStep: 1,
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    })

    // Used by homebridge-zp in Sonos service.
    this.createCharacteristic('CurrentTrack', my.uuid('045'), {
      format: this.formats.STRING,
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Current Track')

    // Used by homebridge-zp in Sonos service.
    this.createCharacteristic('SonosGroup', my.uuid('046'), {
      format: this.formats.STRING,
      perms: [this.perms.READ, this.perms.NOTIFY]
    }, 'Sonos Group')

    // Used by homebridge-zp in Sonos service.
    this.createCharacteristic('ChangeTrack', my.uuid('047'), {
      format: this.formats.INT,
      minValue: -1,
      maxValue: 1,
      minStep: 1, // Force Down|Up control in Eve
      perms: [this.perms.READ, this.perms.NOTIFY, this.perms.WRITE]
    }, 'Change Track')

    // Characteristic for Unique ID, used by homebridge-hue.
    // Source: as exposed by the Philips Hue bridge.  This characteristic is
    // used by the Hue app to select the accessories when syncing Hue bridge
    // Room groups to HomeKit rooms.
    this.createCharacteristic(
      'UniqueID', 'D8B76298-42E7-5FFD-B1D6-1782D9A1F936', {
        format: this.formats.STRING,
        perms: [this.perms.READ]
      }, 'Unique ID'
    )

    // ===== Services ==========================================================

    // Used by homebridge-hue for a schedule or rule.
    this.createService('Resource', my.uuid('011'), [], [
      my.Characteristic.LastTriggered,
      my.Characteristic.TimesTriggered,
      hap.Characteristic.StatusActive,
      my.Characteristic.Enabled,
      my.Characteristic.Resource
    ])

    // Used by homebridge-hue for a Hue bridge or deCONZ gateway.
    this.createService('HueBridge', my.uuid('012'), [
      my.Characteristic.Heartrate,
      my.Characteristic.LastUpdated,
      my.Characteristic.TransitionTime
    ], [
      my.Characteristic.Link,
      my.Characteristic.Touchlink
    ])

    // Used by homebridge-hue for a CLIPGenericStatus sensor.
    this.createService('Status', my.uuid('013'), [
      my.Characteristic.Status
    ])

    // Used by homebridge-zp.
    this.createService('Alarm', my.uuid('048'), [
      my.Characteristic.Enabled
    ])

    // Used by homebridge-zp.
    // Note that a different UUID might be used depending on the config.json
    // setting for "service".
    this.createService('Sonos', hap.Service.Switch.UUID, [
      hap.Characteristic.On,
      hap.Characteristic.Volume,
      hap.Characteristic.Mute,
      my.Characteristic.CurrentTrack,
      // my.Characteristic.ChangeTrack,
      my.Characteristic.SonosGroup
    ])

    // Used by homebridge-zp.
    // Note that a different UUID might be used depending on the config.json
    // setting for "service".
    this.createService('Speaker', hap.Service.Switch.UUID, [
      hap.Characteristic.On,
      hap.Characteristic.Volume,
      hap.Characteristic.Mute,
      my.Characteristic.Bass,
      my.Characteristic.Treble,
      my.Characteristic.Loudness
    ], [
      // my.Charactaristic.Balance
    ])
  }
}
