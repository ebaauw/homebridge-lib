// homebridge-lib/lib/LibPlatform.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.
//
// See https://github.com/ebaauw/homebridge-lib/wiki/LibPlatform.

'use strict';

const dgram = require('dgram');
const util = require('util');

const LibObject = require('./LibObject');

let Service;
let Characteristic;

const context = {
  homebridgeVersion: '',        // Version of homebridge.
  maxAccessories: 99,           // Max # homebridge accessories.
  maxServices: 99,              // Max # services per acccessory.
  nodeVersion: process.version, // Version of NodeJS.
  platformName: '',             // Name of the platform in config.json.
  pluginName: '',               // Name of the plugin, 'homebridge-xxx'
  pluginVersion: ''             // Version of the plugin.
};

// Abstract superclass for homebridge platform plug-in.
module.exports = class LibPlatform extends LibObject {

  // Link this module to homebridge.
  // Called by homebridge, through index.js, when loading the plugin from the
  // plugin directory, typically /usr/local/lib/node_modules.
  static loadPlatform(homebridge, packageJson, platformName, Platform) {
    context.homebridgeVersion = homebridge.serverVersion;
    context.pluginName = packageJson.name;
    context.pluginVersion = packageJson.version;
    context.platformName = platformName;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerPlatform(
      context.pluginName, context.platformName, Platform, true
    );
  }

  // Create a custom Characteristic.
  static createCharacteristic(name, uuid, props, displayName = name) {
    Characteristic[name] = function() {
      Characteristic.call(this, displayName, uuid);
      this.setProps(props);
      this.value = this.getDefaultValue();
    };
    util.inherits(Characteristic[name], Characteristic);
    Characteristic[name].UUID = uuid;
  }

  // Create a custom Service.
  static createService(name, uuid, characteristics, optionalCharacteristics) {
    Service[name] = function(displayName, subtype) {
      Service.call(this, displayName, uuid, subtype);
      for (const characteristic of characteristics) {
        this.addCharacteristic(characteristic);
      }
      for (const characteristic of optionalCharacteristics) {
        this.addOptionalCharacteristic(characteristic);
      }
    };
    util.inherits(Service[name], Service);
    Service[name].UUID = uuid;
  }

  // Initialise the platform.
  // Called by homebridge (through subclass) when initialising the plugin from
  // config.json.
  constructor(log, configJson, homebridge) {
    super();
    this._log = log;
    this._configJson = configJson;
    this._homebridge = homebridge;
    if (context.initialised) {
      this.error(
        'config.json: duplicate entry for %s platform', context.platformName
      );
      process.exit(1);
    }
    context.initialised = true;
    process.on('uncaughtException', this._onException.bind(this));
    process.on('exit', this.onExit.bind(this));
    this._accessories = {};

    if (configJson) {
      this._upnpConfig(configJson.upnp || {});
      this._homebridge.on('didFinishLaunching', this._main.bind(this));
    } else {
      this._homebridge.on('didFinishLaunching', this._cleanup.bind(this));
    }
  }

  // Called on NodeJS exception.
  _onException(error) {
    this._log.error('uncaught exception: ', error);
  }

  // Called when NodeJS is about to exit.
  onExit(status) {
    this.info('homebridge exiting with status %d', status);
  }

  // ===== Main ================================================================

  // Main platform function.
  // Called by homebridge after restoring accessories from cache.
  _main() {
    this._identify();
    if (this.listenerCount('heartbeat') > 0) {
      let beat = -1;
      setInterval(() => {
        beat += 1;
        this.emit('heartbeat', beat);
      }, 1000);
    }
    if (this.listenerCount('upnpDeviceAlive') > 0) {
      this._upnpListen();
    }
    if (this.listenerCount('upnpDeviceFound') > 0) {
      this._upnpSearch();
    }
  }

  // Issue an identity message.
  _identify() {
    this.info(
      '%s v%s, node %s, homebridge v%s',
      context.pluginName, context.pluginVersion,
      context.nodeVersion, context.homebridgeVersion
    );
    const n = Object.keys(this._accessories).length;
    if (n > 0) {
      this.info('exposing %d/%d accessories', n, context.maxAccessories);
    }
    this.debug('config.json: %j', this._configJson);
  }

  // ===== Handle Accessories ==================================================

  // Called by homebridge when restoring cached accessories from
  // ~/.homebridge/accessories/cachedAccessories.
  configureAccessory(accessory) {
    this.debug('%s: %j', accessory.context.name, accessory.context);
    this._accessories[accessory.context.id] = accessory;
    if (this._configJson) {
      this.emit(
        'accessoryRestored',
        accessory.context.className, accessory.context.context
      );
    }
  }

  // Return accessory for params.id.
  _getAccessory(params) {
    return this._accessories[params.id];
  }

  // Add accessory to platform.
  _registerAccessory(params, accessory) {
    if (!this._accessories[params.id]) {
      if (
        Object.keys(this._accessories).length >= context.maxAccessories
      ) {
        this.error('too many accessories, ignoring %s', params.name);
        return undefined;
      }
      this._accessories[params.id] = accessory;
      this._homebridge.registerPlatformAccessories(
        context.pluginName, context.platformName, [accessory]
      );
    }
    return this._accessories[params.id];
  }

  // Remove accessory from platform.
  _unregisterAccessory(accessory) {
    this._homebridge.unregisterPlatformAccessories(
      context.pluginName, context.platformName, [accessory]
    );
    if (this._accessories[accessory.context.id]) {
      delete this._accessories[accessory.context.id];
    }
  }

  // Cleanup cached accessories.
  _cleanup() {
    if (Object.keys(this._accessories).length > 0) {
      this.info('cleanup cached accessories');
      let accessoryList = [];
      for (const key in this._accessories) {
        this.emit(
          'accessoryCleanedUp', this._accessories[key].context.className,
          this._accessories[key].context.context
        );
        accessoryList.push(this._accessories[key]);
      }
      this._homebridge.unregisterPlatformAccessories(
        context.pluginName, context.platformName, accessoryList
      );
      this._accessories = {};
    }
  }

  // ===== UPnP Device Discovery ===============================================

  // Initialise UPnP discovery.
  _upnpConfig(config) {
    this._upnp = {
      // devices: {},
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
    socket.on('listening', () => {
      try {
        socket.addMembership(upnp.address);
      } catch (err) {
        this.error('upnp listener: error %s', err.code);
        socket.close();
      }
      this.debug('upnp listener: listening at %s:%d', upnp.address, upnp.port);
    });
    socket.on('message', (buffer, rinfo) => {
      const response = LibPlatform._upnpParseMessage(buffer);
      if (
        response.status === 'NOTIFY * HTTP/1.1' &&
        response.nt && response.nt === 'upnp:rootdevice' &&
        response.nts && response.nts === 'ssdp:alive'
      ) {
        const address = rinfo.address;
        // if (
        //   !upnp.devices[address] ||
        //   upnp.devices[address].server !== response.server
        // ) {
          this.debug('upnp listener: %s is alive', address);
          this.emit('upnpDeviceAlive', address, response);
        // }
        // upnp.devices[address] = response;
      }
    });
    socket.on('error', (err) => {
      this.error('upnp listener: error %s', err.code);
      socket.close();
    });
    socket.on('close', () => {
      this.debug(
        'upnp listener: restart in %s minutes', upnp.listenerRestartWaitTime
      );
      setTimeout(() => {
        this._upnpListen();
      }, upnp.listenerRestartWaitTime * 60 * 1000);
    });
    socket.bind(upnp.port);
  }

  // Do a one-time active search for UPnP root devices.
  _upnpSearch() {
    const upnp = this._upnp;
    const socket = dgram.createSocket('udp4');
    const request = new Buffer([
      'M-SEARCH * HTTP/1.1',
      util.format('HOST: %s:%d', upnp.address, upnp.port),
      'MAN: "ssdp:discover"',
      util.format('MX: %d', upnp.searchTimeout),
      'ST: upnp:rootdevice',
      ''
    ].join('\r\n'));
    socket.on('message', (buffer, rinfo) => {
      const response = LibPlatform._upnpParseMessage(buffer);
      if (
        response.status === 'HTTP/1.1 200 OK' &&
        response.st && response.st === 'upnp:rootdevice'
      ) {
        const address = rinfo.address;
        // if (
        //   !upnp.devices[address] ||
        //   upnp.devices[address].server !== response.server
        // ) {
          this.debug('upnp search: found %s', address);
          this.emit('upnpDeviceFound', address, response);
        // }
        // upnp.devices[address] = response;
      }
    });
    socket.on('error', (err) => {
      this.error('upnp search: error %s', err.code);
      socket.close();
    });
    socket.on('listening', () => {
      this.debug('upnp search: searching at %s:%d', upnp.address, upnp.port);
      setTimeout(() => {
        socket.close();
        this.debug('upnp search: done');
      }, upnp.searchTimeout * 1000);
    });
    socket.send(request, 0, request.length, upnp.port, upnp.address);
  }

  // Parse a UPnP message into an object
  static _upnpParseMessage(buffer) {
    const lines = buffer.toString().split('\r\n');
    const response = {};
    if (lines && lines[0]) {
      response.status = lines[0];
      for (const line of lines) {
        let fields = line.split(': ');
        if (fields.length === 2) {
          response[fields[0].toLowerCase()] = fields[1];
        }
      }
    }
    return response;
  }

};
