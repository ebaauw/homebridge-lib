// homebridge-lib/lib/LibPlatform.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const dgram = require('dgram');

const LibObject = require('./LibObject');
// const LibAccessory = require('./LibAccessory');
// const LibService = require('./LibService');
// const LibCharacteristic = require('./LibCharacteristic');

// Link this module to homebridge.
let Accessory;
let Service;
let Characteristic;
let generateUUID;

// Static platform variables.
const config = {
  maxAccessories: 99,
  maxServices: 99
};

// Abstract superclass for homebridge platform plug-in.
module.exports = class LibPlatform extends LibObject {

  // Link this module to homebridge.
  // Called by homebridge, through index.js, when loading the plugin from the
  // plugin directory, typically /usr/local/lib/node_modules.
  static loadPlatform(homebridge, packageJson, name, platformConstructor) {
    config.packageJson = packageJson;
    config.name = name;
    homebridge.registerPlatform(
      packageJson.name, name, platformConstructor, true
    );
  }

  // Initialise the platform.
  // Called by homebridge (through subclass) when initialising the plugin from
  // config.json.
  constructor(log, configJson, homebridge) {
    super(log);
    if (Accessory) {
      this.error('config.json: duplicate entry for %s platform', config.name);
      process.exit(1);
    }
    process.on('exit', this._onExit.bind(this));
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    generateUUID = homebridge.hap.uuid.generate;
    this.homebridge = homebridge;
    this._accessories = {};

    if (configJson) {
      // Platform was specified in config.json.
      this._upnpConfig(configJson.upnp || {});
      this.homebridge.on('didFinishLaunching', this._main.bind(this));
    } else {
      // Platform was not specified - cleanup cached accessories.
      this.homebridge.on('didFinishLaunching', this._cleanup.bind(this));
    }
  }

  // Called when homebridge is about to exit.
  _onExit(status) {
    this.info('homebridge exiting with status %d', status);
    if (typeof this.onExit === 'function') {
      this.onExit(status);
    }
  }

  // Main platform function.
  // Called by homebridge after restoring accessories from cache.
  _main() {
    this.logIdentity();
    if (this.listenerCount('heartbeat') > 0) {
      let beat = -1;
      setInterval(function() {
        beat += 1;
        this.emit('heartbeat', beat);
      }.bind(this), 1000);
    }
    if (this.listenerCount('upnpDeviceFound') > 0) {
      this._upnpSearch();
    }
    if (this.listenerCount('upnpDeviceAlive') > 0) {
      this._upnpListen();
    }
  }

  // Issue an identity message.
  logIdentity() {
    this.info(
      '%s v%s, node %s, homebridge v%s',
      config.packageJson.name, config.packageJson.version,
      process.version, this.homebridge.serverVersion
    );
    const n = Object.keys(this._accessories).length;
    if (n > 0) {
      this.info('exposing %d/%d accessories', n, config.maxAccessories);
    }
  }

  // ===== Handle Accessories ==================================================

  // Called by homebridge when restoring cached accessories from
  // ~/.homebridge/accessories/cachedAccessories.
  configureAccessory(accessory) {
    this.debug('%s: restore accessory', accessory.context.name);
    this._accessories[accessory.context.id] = accessory;
  }

  // Return accessory for context.id.
  // If accessory doesn't exist, return newly created accessory with context.
  getAccessory(context) {
    let accessory = this._accessories[context.id];
    if (accessory) {
      accessory.context.name = context.name;
      accessory.context.manufacturer = context.manufacturer;
      accessory.context.model = context.model;
    } else {
      if (Object.keys(this._accessories).length >= config.maxAccessories) {
        this.error('too many accessories, ignoring %s', context.name);
        return undefined;
      }
      accessory = new Accessory(context.name, generateUUID(context.id));
      if (!accessory) {
        return undefined;
      }
      this._accessories[context.id] = accessory;
      accessory.context = context;
      this.homebridge.registerPlatformAccessories(
        config.packageJson.name, config.name, [accessory]
      );
    }
    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, context.name)
      .setCharacteristic(Characteristic.Manufacturer, context.manufacturer)
      .setCharacteristic(Characteristic.Model, context.model)
      .setCharacteristic(Characteristic.SerialNumber, context.id);
    accessory.updateReachability(true);
    return accessory;
  }

  // Remove Accessory.
  removeAccessory(accessory) {
    this.homebridge.unregisterPlatformAccessories(
      config.packageJson.name, config.name, [accessory]
    );
    if (this._accessories[accessory.context.id]) {
      delete this._accessories[accessory.context.id];
    }
  }

  // Cleanup cached accessories.
  _cleanup() {
    if (Object.keys(this._accessories).length > 0) {
      this.log('remove cached accessories');
      let accessoryList = [];
      for (const key in this._accessories) {
        accessoryList.push(this._accessories[key]);
      }
      this.homebridge.unregisterPlatformAccessories(
        config.packageJson.name, config.name, accessoryList
      );
      this._accessories = {};
    }
  }

  // ===== UPnP Device Discovery ===============================================

  // Initialise UPnP discovery.
  _upnpConfig(config) {
    this._upnp = {
      devices: {},
      address: config.address || '239.255.255.250',
      port: config.port || 1900,
      searchTimeout: config.searchTimeout || 5,
      listenerRestartWaitTime: config.listenerRestartWaitTime || 5
    };
  }

  // Listen to SSDP alive messages from UPnP root devices.
  _upnpListen() {
    const upnp = this._upnp;
    const socket = dgram.createSocket({type: 'udp4', reuseAddr: true});
    socket.on('listening', function() {
      try {
        socket.addMembership(upnp.address);
      } catch (err) {
        this.error('upnp listener: error %s', err.code);
        socket.close();
      }
      this.debug('upnp listener: listening at %s:%d', upnp.address, upnp.port);
    }.bind(this));
    socket.on('message', function(buffer, rinfo) {
      const response = LibPlatform._upnpParseMessage(buffer);
      if (
        response.status === 'NOTIFY * HTTP/1.1' &&
        response.nt && response.nt === 'upnp:rootdevice' &&
        response.nts && response.nts === 'ssdp:alive'
      ) {
        const address = rinfo.address;
        if (
          !upnp.devices[address] ||
          upnp.devices[address].server !== response.server
        ) {
          this.log.debug('upnp listener: %s is alive', address);
          this.emit('upnpDeviceAlive', address, response);
        }
        upnp.devices[address] = response;
      }
    }.bind(this));
    socket.on('error', function(err) {
      this.error('upnp listener: error %s', err.code);
      socket.close();
    }.bind(this));
    socket.on('close', function() {
      this.debug(
        'upnp listener: restart in %s minutes', upnp.listenerRestartWaitTime
      );
      setTimeout(function () {
        this._upnpListen();
      }.bind(this), upnp.listenerRestartWaitTime * 60 * 1000);
    }.bind(this));
    socket.bind(upnp.port);
  }

  // Do a one-time active search for UPnP root devices.
  _upnpSearch() {
    const upnp = this._upnp;
    const socket = dgram.createSocket('udp4');
    const request = new Buffer([
      'M-SEARCH * HTTP/1.1',
      this.msg('HOST: %s:%d', upnp.address, upnp.port),
      'MAN: "ssdp:discover"',
      this.msg('MX: %d', upnp.searchTimeout),
      'ST: upnp:rootdevice',
      ''
    ].join('\r\n'));
    socket.on('message', function(buffer, rinfo) {
      const response = LibPlatform._upnpParseMessage(buffer);
      if (
        response.status === 'HTTP/1.1 200 OK' &&
        response.st // && response.st === 'upnp:rootdevice'     HACK
      ) {
        const address = rinfo.address;
        if (
          !upnp.devices[address] ||
          upnp.devices[address].server !== response.server
        ) {
          this.log.debug('upnp search: found %s', address);
          this.emit('upnpDeviceFound', address, response);
        }
        upnp.devices[address] = response;
      }
    }.bind(this));
    socket.on('error', function(err) {
      this.error('upnp search: error %s', err.code);
      socket.close();
    }.bind(this));
    socket.on('listening', function() {
      this.debug('upnp search: searching at %s:%d', upnp.address, upnp.port);
      setTimeout(function () {
        socket.close();
      }.bind(this), upnp.searchTimeout * 1000);
    }.bind(this));
    socket.send(
      request, 0, request.length, upnp.port, upnp.address
    );
  }

  // Parse a UPnP message into an object
  static _upnpParseMessage(buffer) {
    const lines = buffer.toString().split('\r\n');
    const response = {};
    if (lines && lines[0]) {
      response.status = lines[0];
      for (const line in lines) {
        let fields = lines[line].split(': ');
        if (fields.length === 2) {
          response[fields[0].toLowerCase()] = fields[1];
        } else {                                                // HACK
          fields = lines[line].split(':');                      // HACK
          if (fields.length === 2) {                            // HACK
            response[fields[0].toLowerCase()] = fields[1];      // HACK
          }                                                     // HACK
        }
      }
    }
    return response;
  }
};
