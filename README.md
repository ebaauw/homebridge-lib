# homebridge-lib
[![npm](https://img.shields.io/npm/dt/homebridge-lib.svg)](https://www.npmjs.com/package/homebridge-lib) [![npm](https://img.shields.io/npm/v/homebridge-lib.svg)](https://www.npmjs.com/package/homebridge-lib)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Library for Homebridge Plugins
Copyright © 2018-2019 Erik Baauw. All rights reserved.

While developing a number of [Homebridge](https://github.com/nfarina/homebridge) plugins, I find myself duplicating a lot of code.
The idea behind this library is to ease developing and maintaining Homebridge plugins by separating this generic code, dealing with [HomeKit](http://www.apple.com/ios/home/) and Homebridge, from the specific code, dealing with the actual devices being exposed to HomeKit.

### Documentation
The documentation, how to develop a plugin using `homebridge-lib`, is provided in the code and through tutorials in the `doc` directory.
To generate the documentation, install [`jsdoc`](https://github.com/jsdoc3/jsdoc) and run `jsdoc -c jsdoc.json`.
To view the documentation, open `index.html` in the `out` directory.  

See [`homebridge-ws`](https://github.com/ebaauw/homebridge-ws) for an example plugin based on `homebridge-lib`.

### Command-Line Tools
The `homebridge-lib` library comes with a number of command-line tools for troubleshooting Homebridge installations.

Tool    | Description
------- | -----------
`hap`   | Logger for HomeKit accessory announcements.
`json`  | JSON formatter.
`upnp`  | UPnP tool.

Each command-line tool takes a `-h` or `--help` argument to provide a brief overview of its functionality and command-line arguments.

### Installation
Plugins based on `homebridge-lib` define this library as peer dependency, rather than a regular dependency.  This way, `homebridge-lib` is loaded only once and shared across all plugins, similar to Homebridge itself.  Note that as `homebridge-lib` isn't included in the plugin package, it must be installed separately, by issuing:
```
$ sudo npm -g i homebridge-lib
```
To allow `homebridge-lib` to be updated by [`homebridge-config-ui-x`](https://github.com/oznu/homebridge-config-ui-x), it presents itself as a separate plugin to Homebridge.  As it doesn't expose any HomeKit accessories, there is no configuration needed.  It does need to be loaded, however.  If you use the `plugins` key in `config.json` to specify what plugins to load, make sure to include `homebridge-lib`.

### Credits
The logic for handling [Eve](https://www.evehome.com/en/eve-app) history was copied from Simone Tisa's [`fakegato-history`](https://github.com/simont77/fakegato-history) repository, copyright © 2017 simont77.
