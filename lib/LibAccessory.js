// homebridge-lib/lib/LibAccessory.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const LibObject = require('./LibObject');
const LibCharacteristic = require('./LibCharacteristic');

const characteristics = {
  id:           {name: 'SerialNumber'                      },
  manufacturer: {name: 'Manufacturer'                      },
  model:        {name: 'Model'                             },
  hardware:     {name: 'HardwareRevision', isOptional: true},
  firmware:     {name: 'FirmwareRevision', isOptional: true},
  software:     {name: 'SoftwareRevision', isOptional: true}
};

// Delegate for PlatformAccessory.
module.exports = class LibAccessory extends LibObject {

  constructor(platform, params) {
    super(platform, params.name);
    this._accessory = this._platform._getAccessory(params);

    // Create new PlatformAccessory if needed.
    if (!this._accessory) {
      this._accessory = new this._platform._homebridge.platformAccessory(
        params.name,
        this._platform._homebridge.hap.uuid.generate(params.id).toUpperCase(),
        params.category
      );
      this._accessory = this._platform._registerAccessory(
        params, this._accessory
      );
      this._accessory.context = {
        className: this.constructor.name
      };
    }
    this._context = this._accessory.context;

    // Setup AccessoryInformation Service.
    this._service = this._accessory.getService(
      this.Service.AccessoryInformation
    );
    this._libCharacteristics = {};

    for (const key in characteristics) {
      if (!characteristics[key].isOptional || params[key]) {
        this._libCharacteristics[key] = new LibCharacteristic(this, {
          charName: characteristics[key].name,
          key: key,
          value: params[key]
        });
      }
    }

    // Configure PlatformAccessory.
    this._accessory.updateReachability(true);
    this._accessory.on('identify', this._onIdentify.bind(this));
  }

  get context() {
    this._context.context = this._context.context || {};
    return this._context.context;
  }

  _onIdentify(paired, callback) {
    this.info('identify');
    this.emit('identify');
    this.debug('context: %j', this._context);
    callback();
  }

};
