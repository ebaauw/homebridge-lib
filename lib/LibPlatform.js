// homebridge-lib/lib/LibPlatform.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const dgram = require('dgram');

const LibObject = require('./LibObject');
const LibAccessory = require('./LibAccessory');
const LibService = require('./LibService');
const LibCharacteristic = require('./LibCharacteristic');

const globals = {
  package: require('../../../package.json'),
  maxAccessories: 99,
  maxServices: 99
};

// Abstract superclass for homebridge plug-in platform.
module.exports = class LibPlatform extends LibObject {
  // Link this module to homebridge.
  static registerPlatform(api, platformName, platformConstructor) {
    globals.platformName = platformName;
    LibAccessory.linkHomebridge(api);
    LibService.linkHomebridge(api);
    LibCharacteristic.linkHomebridge(api);
    api.registerPlatform(
      globals.package.name, platformName, platformConstructor, true
    );
  }

  // Called by subclass to initialise the platform.
  constructor(log, config, api) {
    super(log);
    this.api = api;
    this.package = globals.package;
    this.maxAccessories = globals.maxAccessories;
    this.maxServices = globals.maxServices;
    this.accessories = {};
    this.logIdentity();
    this.upnp = {
      devices: {},
      ipaddress: '239.255.255.250',
      port: 1900,
      searchTimeout: config.upnp.searchTimeout || 5,
      listenerRestartWaitTime: config.upnp.listenerRestartWaitTime || 5
    };
    this.api.on('didFinishLaunching', this.main.bind(this));
  }

  // Return number of platform accessories.
  nAccessories() {
    return Object.keys(this.accessories).length;
  }

  // Issue an identity message.
  logIdentity() {
    this.info(
      '%s v%s, node %s, homebridge api v%s', globals.package.name,
      globals.package.version, process.version, this.api.version
    );
    if (this.nAccessories() > 0) {
      this.info(
        'exposing %d/%d accessories', this.nAccessories(), this.maxAccessories
      );
    }
  }

  // Main platform function.
  main() {
    const n = this.nAccessories();
    if (n > 0) {
      this.info('restored %d accessories', n);
    }
    if (this.listenerCount('upnpDeviceFound') > 0) {
      this.upnpSearch();
      this.upnpListen();
    }
    if (this.listenerCount('heartbeat') > 0) {
      let beat = -1;
      setInterval(function() {
        beat += 1;
        beat %= 7 * 24 * 60 * 60;
        this.emit('heartbeat', beat);
      }.bind(this), 1000);
    }
  }

  // ===== UPnP Device Discovery ===============================================

  // Listen to alive messages from UPnP root devices.
  upnpListen() {
    const socket = dgram.createSocket({type: 'udp4', reuseAddr: true});
    socket.on('listening', function() {
      try {
        socket.addMembership(this.upnp.ipaddress);
      } catch (err) {
        this.error('upnp listener: error %s', err.code);
        socket.close();
      }
      this.debug(
        'upnp listener: listening at %s:%d',
        this.upnp.ipaddress, this.upnp.port
      );
    }.bind(this));
    socket.on('message', function(buffer, rinfo) {
      const response = LibPlatform.upnpParseMessage(buffer);
      if (
        response.status === 'NOTIFY * HTTP/1.1' &&
        response.nt && response.nt === 'upnp:rootdevice' &&
        response.nts && response.nts === 'ssdp:alive'
      ) {
        this.upnpFoundDevice(
          'upnp listener: %s is alive', rinfo.address, response
        );
      }
    }.bind(this));
    socket.on('error', function(err) {
      this.error('upnp listener: error %s', err.code);
      socket.close();
    }.bind(this));
    socket.on('close', function() {
      this.debug(
        'upnp listener: restart in %s minutes',
        this.upnp.listenerRestartWaitTime
      );
      setTimeout(function () {
        this.upnpListen();
      }.bind(this), this.upnp.listenerRestartWaitTime * 60 * 1000);
    }.bind(this));
    socket.bind(this.upnp.port);
  }

  // Do a one-time active search for UPnP root devices.
  upnpSearch() {
    const socket = dgram.createSocket('udp4');
    const request = new Buffer([
      'M-SEARCH * HTTP/1.1',
      this.msg('HOST: %s:%d', this.upnp.ipaddress, this.upnp.port),
      'MAN: "ssdp:discover"',
      'MX: 5',
      'ST: upnp:rootdevice',
      ''
    ].join('\r\n'));
    socket.on('message', function(buffer, rinfo) {
      const response = LibPlatform.upnpParseMessage(buffer);
      if (
        response.status === 'HTTP/1.1 200 OK' &&
        response.st && response.st === 'upnp:rootdevice'
      ) {
        this.upnpFoundDevice('upnp search: found %s', rinfo.address, response);
      }
    }.bind(this));
    socket.on('error', function(err) {
      this.error('upnp search: error %s', err.code);
      socket.close();
    }.bind(this));
    socket.on('listening', function() {
      this.debug(
        'upnp search: searching at %s:%d',
        this.upnp.ipaddress, this.upnp.port
      );
      setTimeout(function () {
        socket.close();
      }.bind(this), this.upnp.searchTimeout * 1000);
    }.bind(this));
    socket.send(
      request, 0, request.length, this.upnp.port, this.upnp.ipaddress
    );
  }

  // Parse a UPnP message into an object
  static upnpParseMessage(buffer) {
    const lines = buffer.toString().split('\r\n');
    const response = {};
    if (lines && lines[0]) {
      response.status = lines[0];
      for (const line in lines) {
        const fields = lines[line].split(': ');
        if (fields.length === 2) {
          response[fields[0].toLowerCase()] = fields[1];
        }
      }
    }
    return response;
  }

  // Called by upnpListen() and upnpSearch() when a UPnP device is found.
  upnpFoundDevice(msg, ipaddress, response) {
    if (
      !this.upnp.devices[ipaddress] ||
      this.upnp.devices[ipaddress].server !== response.server
    ) {
      this.log.debug(msg, ipaddress);
      this.emit('upnpDeviceFound', ipaddress, response);
    }
    this.upnp.devices[ipaddress] = response;
  }

  // ===== Handle Accessories ==================================================

  // Called by homebridge to restore a cached PlatformAccessory.
  configureAccessory(accessory) {
    this.accessories[accessory.context.id] = accessory;
  }

  // Add PlatformAccessory to platform.
  addAccessory(accessory) {
    const name = accessory.context.name;
    const id = accessory.context.id;
    if (this.accessories[id]) {
      return this.accessories[id];
    }
    if (this.nAccessories() >= this.maxAccessories) {
      this.error('too many accessories, ignoring %s', name);
    }
    this.accessories[id] = accessory;
    this.api.registerPlatformAccessories(
      globals.package.name, globals.platformName, [accessory]
    );
  }

  // Remove PlatformAccessory from platform.
  removeAccessory(accessory) {
    const name = accessory.context.name;
    const id = accessory.context.id;
    if (this.accessories[id]) {
      this.api.unregisterPlatformAccessories(
        globals.package.name, globals.platformName, [accessory]
      );
      delete this.accessories[id];
    }
  }
};
