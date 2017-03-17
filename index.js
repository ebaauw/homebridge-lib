// homebridge-lib/index.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

module.exports = {
  LibPlatform: require('./lib/LibPlatform.js'),
  LibAccessory: require('./lib/LibAccessory.js'),
  LibService: require('./lib/LibService.js'),
  LibCharacteristic: require('./lib/LibCharacteristic.js')
};
