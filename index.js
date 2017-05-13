// homebridge-lib/index.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

module.exports = {
  LibPlatform: require('./lib/LibPlatform'),
  LibAccessory: require('./lib/LibAccessory'),
  LibService: require('./lib/LibService'),
  LibCharacteristic: require('./lib/LibCharacteristic'),
  LibObject: require('./lib/LibObject')
};
