<p align="center">
  <img src="homebridge-lib.png" height="200px">  
</p>
<span align="center">

# Homebridge Lib
[![Downloads](https://img.shields.io/npm/dt/homebridge-lib.svg)](https://www.npmjs.com/package/homebridge-lib)
[![Version](https://img.shields.io/npm/v/homebridge-lib.svg)](https://www.npmjs.com/package/homebridge-lib)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![GitHub issues](https://img.shields.io/github/issues/ebaauw/homebridge-lib)](https://github.com/ebaauw/homebridge-lib/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/ebaauw/homebridge-lib)](https://github.com/ebaauw/homebridge-lib/pulls)

</span>

## Library for Homebridge Plugins
Copyright © 2018-2025 Erik Baauw. All rights reserved.

While developing a number of [Homebridge](https://github.com/homebridge/homebridge) plugins, I find myself duplicating a lot of code.
The idea behind this library is to ease developing and maintaining Homebridge plugins by separating this generic code, dealing with [HomeKit](http://www.apple.com/ios/home/) and Homebridge, from the specific code, dealing with the actual devices being exposed to HomeKit.

### Documentation
The documentation, how to develop a plugin using Homebridge Lib, is provided in the code and through tutorials in the `doc` directory.
To generate the documentation, install [`jsdoc`](https://github.com/jsdoc3/jsdoc) and run `jsdoc -c jsdoc.json`.
To view the documentation, open `index.html` in the `out` directory.  

See [Homebridge WS](https://github.com/ebaauw/homebridge-ws) for an example plugin based on Homebridge Lib.

### Command-Line Tools
The Homebridge Lib library comes with a number of command-line tools for troubleshooting Homebridge installations.

Tool      | Description
--------- | -----------
`hap`     | Logger for HomeKit accessory announcements.
`json`    | JSON formatter.
`sysinfo` | Print hardware and operating system information.
`upnp`    | UPnP tool.

Each command-line tool takes a `-h` or `--help` argument to provide a brief overview of its functionality and command-line arguments.

### Installation
This library is _not_ a Homebridge plugin and does not need to be installed manually.
Instead, Homebridge plugins using this library should list it as a dependency in their `package.json`.
This way, `npm` installs Homebridge Lib automatically when installing the actual plugin.

To install the command-line tools, use:
```
$ sudo npm -g i hb-lib-tools
```
This creates symlinks to these tools in `/usr/bin` or `/usr/local/bin` (depending on how you installed NodeJS).

### Credits
The logic for handling [Eve](https://www.evehome.com/en/eve-app) history was copied from Simone Tisa's [`fakegato-history`](https://github.com/simont77/fakegato-history) repository, copyright © 2017 simont77.

### Caveats
Homebridge Lib is a hobby project of mine, provided as-is, with no warranty whatsoever.  I've been running it successfully at my home for years, but your mileage might vary.
