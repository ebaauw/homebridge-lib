// homebridge-lib/lib/LibObject.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const EventEmitter = require('events');
const util = require('util');

// Abstract superclass for homebridge plug-in objects.
module.exports = class LibObject extends EventEmitter {
  constructor(log, name) {
    super();
    this.log = log;
    this.name = name;
    this.namePrefix = this.name ? this.name + ': ' : '';
  }

  // Update name.
  setName(name) {
    if (name !== this.name) {
      this.info('name changed to %s', name);
      this.name = name;
      this.namePrefix = this.name ? this.name + ': ' : '';
    }
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
    this.log.error(this.namePrefix + msg);
  }

  // Issue a printf()-style formatted info message.
  info() {
    var msg = util.format.apply(msg, arguments);
    this.log.info(this.namePrefix + msg);
  }

  // Issue a printf()-style formatted debug message.
  debug() {
    var msg = util.format.apply(msg, arguments);
    this.log.debug(this.namePrefix + msg);
  }
};
