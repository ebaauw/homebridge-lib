// homebridge-lib/lib/LibAccessory.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const LibObject = require('./LibObject');

// Link this module to homebridge.
let Service;
let Characteristic;

// Abstract superclass for homebridge plug-in platform accessory.
module.exports = class LibAccessory extends LibObject {

  constructor(platform, accessory) {
    super(platform.log, accessory.context.name);
    if (!Service) {
      Service = platform.homebridge.hap.Service;
      Characteristic = platform.homebridge.hap.Characteristic;
    }
    this.platform = platform;
    this.accessory = accessory;
    this.services = {};
    this.accessory.on('identify', this.identify.bind(this));
  }

  identify(paired, callback) {
    this.info('identify');
    this.setIdentify().then(function () {callback();}).bind(this);
  }

  getService(type, subtype) {
    const id = subtype ? type + '#' + subtype : type;
    let service = this.services[id];
    if (!service) {
      service = this.accessory.getService(type, subtype);
      this.services[id] = service;
    }
    return service;
  }
};
