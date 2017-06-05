// homebridge-lib/lib/LibObject.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.
//
// See [Wiki](https://github.com/ebaauw/homebridge-lib/wiki/LibObject).

'use strict';

const EventEmitter = require('events');
const util = require('util');

// Abstract superclass for homebridge-lib objects.
module.exports = class LibObject extends EventEmitter {

  // ===== Constructor =========================================================

  constructor(platform, name) {
    super();
    this._name = name;
    this._platform = platform || this;
    this.on('error', this._onError.bind(this));   // Is this needed?
  }

  // ===== Public properties ===================================================

  get Accessory() {
    return this._platform._homebridge.hap.Accessory;
  }

  get Characteristic() {
    return this._platform._homebridge.hap.Characteristic;
  }

  get Service() {
    return this._platform._homebridge.hap.Service;
  }

  get name() {
    return this._name;
  }
  set name(name) {
    this._name = name;
  }

  get platform() {
    return this._platform;
  }

  get storagePath() {
    return this._platform._homebridge.user.storagePath();
  }

  // ===== Private properties ==================================================

  // Prefix log messages with name.
  get _namePrefix() {
    return this._name ? this._name + ': ' : '';
  }

  // ===== Public methods ======================================================

  // Issue a printf()-style formatted debug message.
  debug(message) {
    this._platform._log.debug(
      this._namePrefix + util.format.apply(this, arguments)
    );
  }

  // Safe emit.
  emit(eventName) {
    try {
      super.emit.apply(this, arguments);
    } catch(error) {
      this.error(error);
    }
  }

  // Issue a printf()-style formatted error message.
  error(message) {
    this._platform._log.error(
      this._namePrefix + 'error: ' + util.format.apply(this, arguments)
    );
  }

  // Issue a printf()-style formatted info message.
  info(message) {
    this._platform._log.info(
      this._namePrefix + util.format.apply(this, arguments)
    );
  }

  // Return a new Error from a printf()-style formatted message.
  newError(message) {
    return new Error(util.format.apply(this, arguments));
  }

  // Issue a printf()-style formatted warning message.
  warning(message) {
    this._platform._log.warn(
      this._namePrefix + 'warning: ' + util.format.apply(this, arguments)
    );
  }

  // ===== Private methods =====================================================

  // Is this needed?
  _onError(error) {
    this.error('>>>>>>');
    this.error(error);
  }

};
