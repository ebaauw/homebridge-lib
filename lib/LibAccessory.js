// homebridge-lib/lib/LibAccessory.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const LibObject = require('./LibObject');

// Abstract superclass for homebridge plug-in platform accessory.
module.exports = class LibAccessory extends LibObject {

  // Initialise delegate for accessory.
  constructor(platform, context) {
    super(platform, context.name);
    this._accessory = platform._addAccessory(context);
    if (!this._accessory) {
      return undefined;
    }
    this._services = {};

    this._accessory.context.name = context.name;
    this._accessory.context.manufacturer = context.manufacturer;
    this._accessory.context.model = context.model;
    for (const key in context) {
      this._accessory.context.context[key] = context[key];
    }
    this._accessory.getService(this.Service.AccessoryInformation)
      .setCharacteristic(this.Characteristic.Name, context.name)
      .setCharacteristic(this.Characteristic.Manufacturer, context.manufacturer)
      .setCharacteristic(this.Characteristic.Model, context.model)
      .setCharacteristic(this.Characteristic.SerialNumber, context.id);
    this._accessory.updateReachability(true);
    this._accessory.on('identify', this._onIdentify.bind(this));
  }

  _onIdentify(paired, callback) {
    this.info('identify');
    if (typeof this.onIdentify !== 'function') {
      return callback();
    }
    this.onIdentify().finally(function () {callback();}).bind(this);
  }

  get id() {
    return this._accessory.context.id;
  }

  set name(name) {
    super.name = name;
    this._accessory.context.name = name;
    this._accessory.getService(this.Service.AccessoryInformation)
      .setValue(this.Characteristic.Name, name);
  }

  get manufacturer() {
    return this._accessory.context.manufacturer;
  }

  get model() {
    return this._accessory.context.model;
  }

  get context() {
    return this._accessory.context.context;
  }

  set context(context) {
    this._accessory.context.context = context;
  }

  _addService(context) {
    const subtype = context.subtype || '';
    let service = this._accessory.getServiceByUUIDAndSubType(
        this.Service[context.type], subtype
    );
    if (!service) {
      service = new this.Service[context.type](context.name, subtype);
      if (!service) {
        return undefined;
      }
      this._accessory.addService(service);
      }
    return service;
  }
};
