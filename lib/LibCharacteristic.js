// homebridge-lib/lib/LibCharacteristic.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const LibObject = require('./LibObject');

// Abstract superclass for a plug-in Characteristic.
module.exports = class LibCharacteristic extends LibObject {

  // Create a libCharacteristic of type context.Characteristic,
  // whose value is in context.obj[context.key]
  constructor(libService, context) {
    super(libService._platform, libService.name);
    this._characteristic = libService.addCharacteristic(context.Characteristic);
    this._obj = context.obj;
    this._key = context.key;
    this._unit = this._characteristic.unit || '';

    if (this.hasPerm(this.Characteristic.Perms.WRITE)) {
      this._characteristic.on('set', (value, callback) => {
        // if (value === this._obj[this._key]) {
        //   return callback();
        // }
        this.info(
          'homekit %s changed from %s%s to %s%s', this._characteristic.name,
          this._obj[this._key], this._unit, value, this._unit
        );
        this._obj[this._key] = value;
        return callback();
      });
    }
  }

  get value() {
    return this._obj[this._key];
  }

  set value(value) {
    this.info(
      'set homekit %s from %s%s to %s%s', this._characteristic.name,
      this._obj[this._key], this._unit, value, this._unit
    );
    this._characteristic.updateValue(value);
  }

  // Check whether characteristic has permission `perm`.
  hasPerm(perm) {
    for (const p of this._characteristic.props.perms) {
      if (p === perm) {
        return true;
      }
    }
    return false;
  }
};
