// homebridge-lib/lib/LibCharacteristic.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const LibObject = require('./LibObject');

// Delegate for Characteristic.
module.exports = class LibCharacteristic extends LibObject {

  constructor(parent, params) {
    // Housekeeping.
    super(parent._platform, parent.name);
    // this._parent = parent;
    // this._accessory = parent._accessory;
    this._service = parent._service;
    this._key = params.key;
    this._unit = params.unit || '';

    // Get or create "my" Characteristic.
    const Char = this.Characteristic[params.charName];
    this._characteristic = this._service.getCharacteristic(Char) ||
      this._service.addCharacteristic(Char);
    if (!this._characteristic) {
      return undefined;
    }

    // Configure "my" Characteristic.
    this._value = params.value;
    if (this._isWriteable) {
      this._characteristic.on('set', (value, callback) => {
        if (value === this._value) {
          return callback();
        }
        this.info(
          '%s changed from %s%s to %s%s', this._characteristic.displayName,
          this._value, this._unit, value, this._unit
        );
        this.emit('willSet', value);
        this._value = value;
        return callback();
      });
    }

    // Create property in parent.
    if (this._key !== 'id') {
      Object.defineProperty(parent, this._key, {
        get: () => {return this._value;},
        set: (value) => {this._value = value;}
      });
    }
  }

  get _value() {
    return this._characteristic.value;
  }

  set _value(value) {
    if (value === this._value) {
      return;
    }
    if (this._value) {
      this.info(
        'set %s from %s%s to %s%s', this._characteristic.displayName,
        this._value, this._unit, value, this._unit
      );
    } else {
      this.info(
        'set %s to %s%s', this._characteristic.displayName,
        value, this._unit
      );
    }
    this._characteristic.updateValue(value);
  }

  get _isWriteable() {
    for (const p of this._characteristic.props.perms) {
      if (p === this.Characteristic.Perms.WRITE) {
        return true;
      }
    }
    return false;
  }

};
