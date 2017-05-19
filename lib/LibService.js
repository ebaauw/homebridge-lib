// homebridge-lib/lib/LibService.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const LibObject = require('./LibObject');

module.exports = class LibService extends LibObject {

  constructor(libAccessory, context) {
    super(libAccessory._platform, context.name);
    this._libAccessory = libAccessory;
    this._service = this._libAccessory._addService(context);
    if (!this._service) {
      return undefined;
    }
    this._characteristics = {};
  }
};
