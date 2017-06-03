// homebridge-lib/lib/LibObject.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const EventEmitter = require('events');
const util = require('util');

// Abstract superclass for homebridge plug-in objects.
module.exports = class LibObject extends EventEmitter {
  constructor(platform, name) {
    super();
    this.name = name;
    this._platform = platform || this;
    this.on('error', this._onError.bind(this));   // Is this needed?
  }

  // Properties
  get platform() {
    return this._platform;
  }
  get Accessory() {
    return this._platform._homebridge.hap.Accessory;
  }
  get Service() {
    return this._platform._homebridge.hap.Service;
  }
  get Characteristic() {
    return this._platform._homebridge.hap.Characteristic;
  }
  get storagePath() {
    return this._platform._homebridge.user.storagePath();
  }

  get _namePrefix() {
    return this.name ? this.name + ': ' : '';
  }

  // Return a new Error from a printf()-style formatted message.
  newError(message) {
    return new Error(util.format.apply(this, arguments));
  }

  // Issue a printf()-style formatted error message.
  error(message) {
    this._platform._log.error(
      this._namePrefix + 'error: ' + util.format.apply(this, arguments)
    );
  }

  // Issue a printf()-style formatted warning message.
  warning(message) {
    this._platform._log.warn(
      this._namePrefix + 'warning: ' + util.format.apply(this, arguments)
    );
  }

  // Issue a printf()-style formatted info message.
  info(message) {
    this._platform._log.info(
      this._namePrefix + util.format.apply(this, arguments)
    );
  }

  // Issue a printf()-style formatted debug message.
  debug(message) {
    this._platform._log.debug(
      this._namePrefix + util.format.apply(this, arguments)
    );
  }

  // Is this needed?
  _onError(error) {
    this.error('>>>>>>');
    this.error(error);
  }

  // Safe emit.
  emit(eventName) {
    try {
      super.emit.apply(this, arguments);
    } catch(error) {
      this.error(error);
    }
  }

};
