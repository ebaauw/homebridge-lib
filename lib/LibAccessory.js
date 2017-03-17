// homebridge-lib/lib/LibAccessory.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const LibObject = require('./LibObject');

// Link this module to homebridge.
let Accessory;
let Service;
let Characteristic;
let generateUUID;

// Abstract superclass for homebridge plug-in platform accessory.
module.exports = class LibAccessory extends LibObject {
  // Link this module to homebridge.
  static linkHomebridge(homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    generateUUID = homebridge.hap.uuid.generate;
  }

  constructor(platform, accessory, context) {
    super(platform.log, context.name);
    this.platform = platform;
    if (accessory) {
      // Called from LibPlatform.configureAccessory() to restore accessory
      // from ~/.homebridge/accessories/cachedAccessories.
      this.accessory = accessory;
      for (const service of this.accessory.services) {
        if (service.UUID === Service.AccessoryInformation.UUID) {
          this.infoService = service;
          for (const characteristic of service.characteristics) {
            if (characteristic.UUID === Characteristic.Name.UUID) {
              // this.displayName = characteristic.value;
            }
          }
        }
      }
    } else {
      // Create a new Accessory for LibPlatform.
      const uuid = generateUUID(context.id);
      this.accessory = new Accessory(context.name, uuid);
      this.accessory.updateReachability(true);
      this.accessory.context = context;
      platform.addAccessory(this.accessory);
      this.infoService = this.accessory.getService(
        Service.AccessoryInformation
      );
      this.infoService = this.accessory.getService(
        Service.AccessoryInformation
      );
      this.infoService.setCharacteristic(
        Characteristic.Name, this.name
      );
      this.infoService.setCharacteristic(
        Characteristic.Manufacturer, this.accessory.context.manufacturer
      );
      this.infoService.setCharacteristic(
        Characteristic.Model, this.accessory.context.model
      );
      this.infoService.setCharacteristic(
        Characteristic.SerialNumber, this.accessory.context.id
      );
    }
    this.accessory.on('identify', this.identify.bind(this));
  }

  update(context) {
    if (!this.accessory.reachable) {
      this.info('now reachable');
      this.accessory.updateReachability(true);
    }
    if (context.name !== this.name) {
      super.setName(context);
      this.accessory.context.name = this.name;
      this.accessory.displayName = this.name;
      this.infoService.displayName = this.name;
      this.infoService.setCharacteristic(Characteristic.Name, this.name);
    }
  }
};
