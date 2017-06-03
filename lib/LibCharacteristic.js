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
    this._parent = parent;
    // this._accessory = parent._accessory;
    this._service = parent._service;
    this._context = parent._context;
    this._key = params.key;
    this._unit = params.unit || '';

    // Get or create "my" Characteristic.
    const Char = this.Characteristic[params.charName];
    this._characteristic = this._service.getCharacteristic(Char) ||
      this._service.addCharacteristic(Char);
    if (this._isWriteable) {
      this._characteristic.on('set', (value, callback) => {
        if (value === this._value) {
          return callback();
        }
        this.info(
          '%s changed from %s%s to %s%s', this._characteristic.displayName,
          this._value, this._unit, value, this._unit
        );
        this._context[this._key] = value;
        callback();
        parent.emit('didSet', this._key, value);
      });
    }

    // Create property in parent.
    if (this._key === 'id') {
      Object.defineProperty(parent, this._key, {
        get: () => {return this._value;}
      });
    } else {
      Object.defineProperty(parent, this._key, {
        get: () => {return this._value;},
        set: (value) => {this._value = value;}
      });
    }

    // Set the value.
    if (params.value !== undefined) {
      this._value = params.value;
    } else if (this._value === undefined && params.default !== undefined) {
      this._value = params.default;
    }
  }

  get _namePrefix() {
    return this._parent.name ? this._parent.name + ': ' : '';
  }

  get _value() {
    return this._context[this._key];
  }

  set _value(value) {
    if (!this._isValid(value)) {
      throw this.newError(
        '%j: invalid value for %s', value, this._characteristic.displayName
      );
    }
    if (this._value === undefined) {
      this.info(
        'set %s to %s%s', this._characteristic.displayName,
        value, this._unit
      );
    } else {
      if (value === this._value) {
        return;
      }
      this.info(
        'set %s from %s%s to %s%s', this._characteristic.displayName,
        this._value, this._unit, value, this._unit
      );
    }
    this._context[this._key] = value;
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

  _isValid(value) {
    if (value === undefined || value === null) {
      return false;
    }
    const props = this._characteristic.props;
    if (props.minValue && value < props.minValue) {
      return false;
    }
    if (props.maxValue && value > props.maxValue) {
      return false;
    }
    // TODO: stepValue
    if (!props.validValues) {
      return true;
    }
    for (const validValue in props.validValues) {
      if (value === validValue) {
        return true;
      }
    }
    return false;
  }

};
