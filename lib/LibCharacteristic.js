// homebridge-lib/lib/LibCharacteristic.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const deferred = require('deferred');

const LibObject = require('./LibObject');

// Link this module to homebridge.
let Characteristic;

// Abstract superclass for a plug-in Characteristic.
module.exports = class LibCharacteristic extends LibObject {
  // Link this module to homebridge.
  static linkHomebridge(api) {
    Characteristic = api.hap.Characteristic;
  }

  constructor(libService, type) {
    super(libService.log, libService.name);
    this.libService = libService;
    this.service = libService.service;
    this.service.addOptionalCharacteristic(Characteristic[type]);
    this.characteristic = this.service.getCharacteristic(Characteristic[type]);
    this.unit = this.characteristic.unit || '';
    if (this.hasPerm(Characteristic.Perms.WRITE)) {
      this.characteristic.on('set', this.didSet.bind(this));
    }
  }

  // Check whether characteristic has permission `perm`.
  hasPerm(perm) {
    for (const p of this.characteristic.props.perms) {
      if (p === perm) {
        return true;
      }
    }
    return false;
  }

  // Set the value of the homekit characteristic.
  set(newValue) {
    if (newValue !== this.value) {
      this.info(
        'set homekit %s from %s%s to %s%s', this.characteristic.name,
        this.value, this.unit, newValue, this.unit
      );
      this.value = newValue;
      this.characteristic.updateValue(this.value);
    }
  }

  // Called when a homekit client requests the value of the characteristic.
  get(callback) {
    callback(null, this.value);
  }

  // Called after a homekit client or homebridge has set the value of the
  // characteristic.
  didSet(newValue, callback) {
    if (newValue === this.value) {
      return callback();
    }
    this.info(
      'homekit %s changed from %s%s to %s%s', this.characteristic.name,
      this.value, this.unit, newValue, this.unit
    );
    this.value = newValue;
    this.libService.emit('didSetCharacteristic', this.type, newValue);
    return callback();
  }
};
