// homebridge-lib/lib/LibAccessory.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const LibObject = require('./LibObject');
let Service;
let Characteristic;

const characteristics = {
  id:           {name: 'SerialNumber',                     },
  name:         {name: 'Name',                             },
  manufacturer: {name: 'Manufacturer',                     },
  model:        {name: 'Model',                            },
  hardware:     {name: 'HardwareRevision', isOptional: true},
  firmware:     {name: 'FirmwareRevision', isOptional: true},
  software:     {name: 'SoftwareRevision', isOptional: true}
};

// Abstract superclass for homebridge plug-in platform accessory.
module.exports = class LibAccessory extends LibObject {

  // Initialise delegate for accessory.
  constructor(platform, context) {
    super(platform, context.name);
    if (!Service) {
      Service = this.Service;
      Characteristic = this.Characteristic;
    }
    this._accessory = platform._addAccessory(context);
    if (!this._accessory) {
      return undefined;
    }
    this._service = this._accessory.getService(Service.AccessoryInformation);
    for (const key in characteristics) {
      this[key] = context[key];
      // delete context[key];
    }
    this.type = this.constructor.name;
    context.type = this.type;
    this._accessory.updateReachability(true);
    this._accessory.on('identify', this._onIdentify.bind(this));
  }

  _onIdentify(paired, callback) {
    this.info('identify');
    this.emit('identify');
    this.debug('context: %j', this._accessory.context);
    callback();
  }

  // Properties.
  _getter(key)        {return this._accessory.context[key];}
  _setter(key, value) {
    const Char = Characteristic[characteristics[key].name];
    if (value) {
      this._accessory.context[key] = value;
      (this._service.getCharacteristic(Char) ||
       this._service.addCharacteristic(Char)).setValue(value);
    } else if (characteristics[key].isOptional && this._accessory.context[key]) {
      this._service.removeCharacteristic(
        this._service.getCharacteristic(Char)
      );
    }
  }
  get id()                       {return this._getter('id');}
  set id(id)                     {this._setter('id', id);}
  get name()                     {return super.name;}
  set name(name)                 {super.name = name; this._setter('name', name);}
  get type()                     {return this._accessory.context.type;}
  set type(type)                 {this._accessory.context.type = type;}
  get manufacturer()             {return this._getter('manufacturer');}
  set manufacturer(manufacturer) {this._setter('manufacturer', manufacturer);}
  get model()                    {return this._getter('model');}
  set model(model)               {this._setter('model', model);}
  get hardware()                 {return this._getter('hardware');}
  set hardware(hardware)         {this._setter('hardware', hardware);}
  get firmware()                 {return this._getter('firmware');}
  set firmware(firmware)         {this._setter('firmware', firmware);}
  get software()                 {return this._getter('software');}
  set software(software)         {this._setter('software', software);}
  get context()                  {return this._accessory.context.context;}
  set context(context)           {this._accessory.context.context = context;}

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
