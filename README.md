# homebridge-lib
[![npm](https://img.shields.io/npm/dt/homebridge-lib.svg)](https://www.npmjs.com/package/homebridge-lib) [![npm](https://img.shields.io/npm/v/homebridge-lib.svg)](https://www.npmjs.com/package/homebridge-lib)

## Utility Library for Homebridge Plugins
Copyright © 2017 Erik Baauw. All rights reserved.

While developing a number of [homebridge](https://github.com/nfarina/homebridge) plugins, I find myself duplicating a lot of code.  The idea behind this utility library is to ease developing and maintaining homebridge plugins by separating this generic code, dealing with [HomeKit](http://www.apple.com/ios/home/) and homebridge, from the specific code, dealing with the actual devices being exposed to HomeKit.

The homebridge-lib library provides the following functionality:
- Support for homebridge v2 dynamic platforms, including saving and restoring accessories from persistent storage between homebridge sessions;
- Universal Plug & Play (UPnP) device discovery;
- Setting up a heartbeat for device polling;
- Logging and error handling.

Technically, the homebridge-lib library is based on the following:
- Using promises rather than callback functions.  The promises are provided by [deferred](https://github.com/medikoo/deferred);
- Using javascript classes rather than prototypes.  An actual plugin extends the classes provided by homebridge-lib;
- Using events.  In fact all homebridge-lib classes extend `EventEmitter`;

The homebridge-lib library provides a number of abstract superclasses, that act as delegate for homebridge platform plugins and for HomeKit accessories, services, and characteristics.  A homebridge plugin based on homebridge-lib extends these classes, providing the device-specific logic.

Class | Extends | Delegate for | HomeKit
----- | ------- | ------------ | -------
`LibPlatform` | `LibObject` | -- | --
`LibAccessory` | `LibObject` | `PlatformAccessory` | accessory
`LibService` | `LibObject` | `Service` | service
`LibCharacteristic` | `LibObject` | `Characteristic` | characteristic
`LibObject` | `EventEmitter` | -- | --

See the [Wiki](https://github.com/ebaauw/homebridge-lib/wiki) for more information.

## Installation
This library is _not_ a homebridge plugin and should not be installed manually.  Instead, homebridge plugins using this library should list it as a dependency in their `package.json`.  This way, `npm` installs homebridge-lib automatically when installing the actual plugin.
