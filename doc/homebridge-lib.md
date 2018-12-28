Copyright © 2017-2019 Erik Baauw. All rights reserved.

## Introduction
While developing a number of [Homebridge](https://github.com/nfarina/homebridge) plugins, I find myself duplicating a lot of code.
The idea behind this library is to ease developing and maintaining Homebridge plugins by separating this generic code, dealing with [HomeKit](http://www.apple.com/ios/home/) and Homebridge, from the specific code, dealing with the actual devices being exposed to HomeKit.

Technically, the `homebridge-lib` library is based on the following starting points:
- Using the Homebridge [dynamic platform plugin API](https://github.com/nfarina/homebridge/wiki/On-Programming-Dynamic-Platforms);
- Using JavaScript [asynchronous functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) rather than callbacks;
- Using JavaScript [classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) rather than prototypes.  An actual plugin would extend the classes provided by `homebridge-lib`;
- Using NodeJS [events](https://nodejs.org/dist/latest-v10.x/docs/api/events.html).  In fact all `homebridge-lib` delegate classes extend `EventEmitter`;
- Using the [standard](https://github.com/standard/standard) JavaScript style guide;
- Using [JsDoc](https://github.com/jsdoc3/jsdoc) for API documentation;
- Using [mocha](https://mochajs.org) for automated testing of the generic utilities.

### Abstract Superclasses
The `homebridge-lib` library provides a number of abstract superclasses for a Homebridge dynamic platform plugin and for delegates to a HomeKit accessory, service, and characteristic.

Class                          | Description
------------------------------ | -----------
{@link Platform}               | Abstract superclass for a Homebridge dynamic platform plugin.
{@link AccessoryDelegate}      | Abstract superclass for a HomeKit accessory delegate.
{@link ServiceDelegate}        | Abstract superclass for a HomeKit service delegate.
{@link CharacteristicDelegate} | Abstract superclass for a HomeKit characteristic delegate.
{@link Delegate}               | Abstract superclass for `Platform`, `AccessoryDelegate`, `ServiceDelegate`, and `CharacteristicDelegate`.

These delegate classes provide the following functionality:
- Saving and restoring accessories from persistent storage between Homebridge sessions (using the homebridge dynamic platform API);
- History for [Eve](https://www.evehome.com/en/eve-app);
- Universal Plug & Play (UPnP) device discovery;
- Setting up a heartbeat for device polling;
- Logging and error handling;
- Checking the NodeJS and Homebridge versions used;
- Checking the latest plugin version published to the NPM registry.

A Homebridge plugin based on `homebridge-lib` extends these classes, providing the device-specific logic.
See [`homebridge-ws`](https://github.com/ebaauw/homebridge-ws) for an example plugin based on `homebridge-lib`.

### API Wrapper
The `homebridge-lib` library provides a wrapper around the remaining Homebride and [HAP-NodeJS](https://github.com/KhaosT/HAP-NodeJS) APIs, that cannot be hidden by the abstract superclasses.

Class       | Description
----------- | -----------
{@link hap} | HomeKit Accessory Protocol.
{@link eve} | Custom HomeKit services and characteristic used by the [Eve](https://www.evehome.com/en/eve-app) app.
{@link my}  | Custom HomeKit services and characteristics used by [my plugins](https://github.com/ebaauw).

### Command-Line Utilities
The `homebridge-lib` library comes with a number of command-line tools for troubleshooting Homebridge installations.

Tool    | Description
------- | -----------
`hap`   | Logger for HomeKit accessory announcements.
`json`  | JSON formatter.
`upnp`  | Logger for UPnP device announcements.

Each command-line tool takes a `-h` or `--help` argument to provide a brief overview of its functionality and command-line arguments.

### Utility Classes
The `homebridge-lib` library provides a number of utility classes for Homebridge plugins and/or command-line tools.

Class                     | Description
------------------------- | -----------
{@link CommandLineParser} | Parser and validator for command-line arguments.
{@link CommandLineTool}   | Abstract superclass for a command-line tool.
{@link JsonFormatter}     | JSON formatter.
{@link RestClient}        | REST API client.
{@link TypeParser}        | Parser and validator for types.
{@link UpnpClient}        | Universal Plug and Play client.
