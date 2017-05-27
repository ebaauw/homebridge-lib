// homebridge-lib/lib/LibService.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const LibObject = require('./LibObject');

// Delegate for Service.
module.exports = class LibService extends LibObject {

  constructor(parent, params) {
    // Housekeeping.
    super(parent._platform, params.name);
    // this._parent = parent;
    this._accessory = parent._accessory;
    this._index = params.subtype ?
      [params.serviceName, params.subtype].join('#') :
      params.serviceName;

    // Get "my" Service.
    const Service = this.Service[params.serviceName];
    this._service = params.subtype ?
      this._accessory.getServiceByUUIDAndSubType(Service, params.subtype) :
      this._accessory.getService(Service);

    // Create new Service if needed.
    if (!this._service) {
      this._service = new Service(params.name, params.subtype);
      this._service = this._accessory.addService(this._service);
      if (!this.service) {
        return undefined;
      }
    }
  }

};
