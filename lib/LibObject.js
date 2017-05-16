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
    this._platform = platform || this;
    this._name = name;
    this._namePrefix = this._name ? this._name + ': ' : '';
    this.on('error', this._onError.bind(this));
  }

  get name() {
    return this._name;
  }

  // Update name.
  set name(name) {
    if (name && name !== this._name) {
      this.info('name changed to %s', name);
    }
    this._name = name;
    this._namePrefix = this._name ? this._name + ': ' : '';
  }

  get platform() {
    return this._platform;
  }

  get Accessory() {
    return this._platform._homebridge.platformAccessory;
  }

  get Service() {
    return this._platform._homebridge.hap.Service;
  }

  get Characteristic() {
    return this._platform._homebridge.hap.Characteristic;
  }

  // Return a printf()-style formatted message.
  msg() {
    var msg = util.format.apply(msg, arguments);
    return msg;
  }

  // Return a new Error from a printf()-style formatted message.
  newError() {
    var msg = util.format.apply(msg, arguments);
    return new Error(msg);
  }

  // Issue a printf()-style formatted error message.
  error() {
    var msg = util.format.apply(msg, arguments);
    this._platform._log.error(this._namePrefix + 'error: ' + msg);
  }

  // Issue a printf()-style formatted warning message.
  warning() {
    var msg = util.format.apply(msg, arguments);
    this._platform._log.warn(this._namePrefix + 'warning: ' + msg);
  }

  // Issue a printf()-style formatted info message.
  info() {
    var msg = util.format.apply(msg, arguments);
    this._platform._log.info(this._namePrefix + msg);
  }

  // Issue a printf()-style formatted debug message.
  debug() {
    var msg = util.format.apply(msg, arguments);
    this._platform._log.debug(this._namePrefix + msg);
  }

  _onError(error) {
    this.error(error);
  }

};
