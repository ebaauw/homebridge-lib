// homebridge-lib/lib/LibService.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const LibObject = require('./LibObject');

// Link this module to homebridge.
let Service;

module.exports = class LibService extends LibObject {
  // Link this module to homebridge.
  static linkHomebridge(api) {
    Service = api.hap.Service;
  }

  constructor(accessory, service, context) {
    super(accessory.log, context.name);
    this.accessory = accessory;
    this.Service = Service[context.type];
    if (service) {
      this.service = service;
    } else {
      this.service = new this.Service();
    }
  }
};
