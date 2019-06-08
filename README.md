# homebridge-lib
[![npm](https://img.shields.io/npm/dt/hblib.svg)](https://www.npmjs.com/package/hblib) [![npm](https://img.shields.io/npm/v/hblib.svg)](https://www.npmjs.com/package/hblib)
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
To install `homebridge-lib`, use:
```
$ sudo npm -g i hblib
```

### Credits
The logic for handling [Eve](https://www.evehome.com/en/eve-app) history was copied from Simone Tisa's [`fakegato-history`](https://github.com/simont77/fakegato-history) repository, copyright © 2017 simont77.
