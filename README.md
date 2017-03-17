# homebridge-lib
[![npm](https://img.shields.io/npm/dt/homebridge-lib.svg)](https://www.npmjs.com/package/homebridge-lib) [![npm](https://img.shields.io/npm/v/homebridge-lib.svg)](https://www.npmjs.com/package/homebridge-lib)

## Utility Library for Homebridge Plugins
Copyright © 2017 Erik Baauw. All rights reserved.

While developing a number of [homebridge](https://github.com/nfarina/homebridge) plugins, I find myself duplicating a lot of code.  The idea behind this utility library is to ease developing and maintaining homebridge plugins by separating this generic code, dealing with [HomeKit](http://www.apple.com/ios/home/) and homebridge, from the specific code, dealing with the actual devices being bridged.

The homebridge-lib library provides the following functionality:
- Support for homebridge v2 dynamic platforms, including saving and restoring accessories from persistent storage between homebridge sessions;
- Universal Plug & Play (UPnP) device discovery;
- Setting up a heartbeat for device polling;
- Logging and error handling.

Technically, the homebridge-lib library is based on the following:
- Using promises rather than callback functions.  The promises are provided by [deferred](https://github.com/medikoo/deferred);
- Using javascript classes rather than prototypes.  An actual plugin extends the classes provided by homebridge-lib;
- Using events.  In fact all homebridge-lib classes extend `EventEmitter`;

The homebridge-lib library provides a number of abstract superclasses, that act as delegate for homebridge platforms and for HomeKit accessories, services, and characteristics.  A homebridge plugin based on homebridge-lib extends these classes, providing the device-specific logic.

Class | Extends | Delegate for | HomeKit
----- | ------- | ------------ | -------
`LibPlatform` | `LibObject` | -- | --
`LibAccessory` | `LibObject` | `PlatformAccessory` | accessory
`LibService` | `LibObject` | `Service` | service
`LibCharacteristic` | `LibObject` | `Characteristic` | characteristic
`LibObject` | `EventEmitter` | -- | --





## `LibPlatform`

To use `LibPlatform`, create a `lib/MyPlatform.js` module that exposes your platform class as a subtype of `LibPlatform`:
```javascript
class MyPlatform extends LibPlatform {
  constructor(log, config, api) {
    super(log, config, api);
    // Setup MyPlatform.
};
```

### UPnP Device Discovery
When Universal Plug and Play device discovery is enabled, homebridge-lib listens for UPnP _alive_ messages.  On startup, it issues a UPnP device discovery request and listens for the responses.  For any new root device found, homebridge-lib issues a `upnpDeviceFound` event, passing the device's IP address and the contents of alive message or the discovery response.  
To enable UPnP device discovery, simply add a listener to the `upnpDeviceFound` event in your platform constructor:
```javascript
class MyPlatform extends LibPlatform {
  constructor(log, config, api) {
    super(log, config, api);
    // Setup MyPlatform.
    this.on('upnpDeviceFound', function(ipaddress, response) {
      // Setup the device.
    }.bind(this));
  }
};
```

### Device Polling
When heartbeat is enabled, homebridge-lib emits a `heartbeat` event every second, passing the sequence number of the heartbeat event.  
To enable the heartbeat, simply add a listener to the `heartbeat` event in your platform constructor:
```javascript
class MyPlatform extends LibPlatform {
  constructor(log, config, api) {
    super(log, config, api);
    // Setup devices.
    this.on('heartbeat', function(beat) {
      if (beat % 10 === 0) {
        // Poll devices every 10 seconds.
      }
    }.bind(this));
  }
};
```
By using a variable instead of a hard-coded constant, the heartrate can be changed at runtime.  By exposing this variable as a characteristic, the heartrate can even be set from HomeKit, see [homebridge-hue](https://github.com/ebaauw/homebridge-hue) as an example.

## `LibAccessory`

## `LibService`

## `LibCharacteristic`

## Installation
This library is not a homebridge plugin and should not be installed manually.  Instead, homebridge plugins using this library should list it as a dependency in their `package.json`.

To link a platform plugin based on homebridge-lib to homebridge, the plugin's `index.js` module should contain following code:
```javascript
const MyPlatform = require('./lib/MyPlatform');

module.exports = function(api) {
  MyPlatform.registerPlatform(api);
};
```

The plugin's `lib/MyPlatform.js` module exports the `MyPlatform` class:
```javascript
const LibPlatform = require('homebridge-lib').LibPlatform;

module.exports = class MyPlatform extends LibPlatform {
  constructor(log, config, api) {
    super(log, config, api);
    // Setup MyPlatform.
};

```
