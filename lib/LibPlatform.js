// homebridge-lib/lib/LibPlatform.js
//
// Library for homebridge plug-ins.
// Copyright © 2017 Erik Baauw. All rights reserved.

'use strict';

const dgram = require('dgram');
const util = require('util');

const LibObject = require('./LibObject');

let Service;
let Characteristic;

const context = {
  maxAccessories: 99,
  maxServices: 99
};

// Abstract superclass for homebridge platform plug-in.
module.exports = class LibPlatform extends LibObject {

  // Link this module to homebridge.
  // Called by homebridge, through index.js, when loading the plugin from the
  // plugin directory, typically /usr/local/lib/node_modules.
  static loadPlatform(homebridge, pkg, name, Platform) {
    context.pkg = pkg;
    context.name = name;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerPlatform(pkg.name, name, Platform, true);
  }

  // Create a custom Characteristic.
  static createCharacteristic(id, uuid, props, name = id) {
    Characteristic[id] = function() {
      Characteristic.call(this, name, uuid);
      this.setProps(props);
      this.value = this.getDefaultValue();
    };
    util.inherits(Characteristic[id], Characteristic);
    Characteristic[id].UUID = uuid;
  }

  // Create a custom Service.
  static createService(id, uuid, characteristics, optionalCharacteristics) {
    Service[id] = function(displayName, subtype) {
      Service.call(this, displayName, uuid, subtype);
      for (const characteristic of characteristics) {
        this.addCharacteristic(characteristic);
      }
      for (const characteristic of optionalCharacteristics) {
        this.addOptionalCharacteristic(characteristic);
      }
    };
    util.inherits(Service[id], Service);
    Service[id].UUID = uuid;
  }

  // Initialise the platform.
  // Called by homebridge (through subclass) when initialising the plugin from
  // config.json.
  constructor(log, config, homebridge) {
    super();
    this._log = log;
    this._config = config;
    this._homebridge = homebridge;
    this._context = context;
    if (context.initialised) {
      this.error('config.json: duplicate entry for %s platform', context.name);
      process.exit(1);
    }
    context.initialised = true;
    process.on('uncaughtException', this._onException.bind(this));
    process.on('exit', this.onExit.bind(this));
    this._accessories = {};

    if (config) {
      this._upnpConfig(config.upnp || {});
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
      this._context.pkg.name, this._context.pkg.version,
      process.version, this._homebridge.serverVersion
    );
    const n = Object.keys(this._accessories).length;
    if (n > 0) {
      this.info('exposing %d/%d accessories', n, this._context.maxAccessories);
    }
    this.debug('config.json: %j', this._config);
  }

  // ===== Handle Accessories ==================================================

  // Called by homebridge when restoring cached accessories from
  // ~/.homebridge/accessories/cachedAccessories.
  configureAccessory(accessory) {
    this.debug('%s: restored from peristent storage', accessory.context.name);
    this._accessories[accessory.context.id] = accessory;
    this.emit('accessoryRestored', accessory.context.context);
  }

  // Return accessory for context.id.
  // If accessory doesn't exist, return newly created accessory with context.
  _addAccessory(context) {
    let accessory = this._accessories[context.id];
    if (!accessory) {
      if (
        Object.keys(this._accessories).length >= this._context.maxAccessories
      ) {
        this.error('too many accessories, ignoring %s', context.name);
        return undefined;
      }
      accessory = new this._homebridge.platformAccessory(
        context.name,
        this._homebridge.hap.uuid.generate(context.id).toUpperCase(),
        context.category
      );
      if (!accessory) {
        return undefined;
      }
      accessory.context = {
        id: context.id,
        context: {}
      };
      this._accessories[context.id] = accessory;
      this._homebridge.registerPlatformAccessories(
        this._context.pkg.name, this._context.name, [accessory]
      );
    }
    return accessory;
  }

  // Remove accessory.
  _deleteAccessory(accessory) {
    this._homebridge.unregisterPlatformAccessories(
      this._context.pkg.name, this._context.name, [accessory]
    );
    if (this._accessories[accessory.context.id]) {
      delete this._accessories[accessory.context.id];
    }
  }

  // Cleanup cached accessories.
  _cleanup() {
    if (Object.keys(this._accessories).length > 0) {
      this.info('remove cached accessories');
      let accessoryList = [];
      for (const key in this._accessories) {
        accessoryList.push(this._accessories[key]);
      }
      this._homebridge.unregisterPlatformAccessories(
        this._context.pkg.name, this._context.name, accessoryList
      );
      this._accessories = {};
    }
  }

  // ===== UPnP Device Discovery ===============================================

  // Initialise UPnP discovery.
  _upnpConfig(context) {
    this._upnp = {
      devices: {},
      address: context.address || '239.255.255.250',
      port: context.port || 1900,
      searchTimeout: context.searchTimeout || 5,
      listenerRestartWaitTime: context.listenerRestartWaitTime || 5
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
        if (
          !upnp.devices[address] ||
          upnp.devices[address].server !== response.server
        ) {
          this.debug('upnp listener: %s is alive', address);
          this.emit('upnpDeviceAlive', address, response);
        }
        upnp.devices[address] = response;
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
      this.msg('HOST: %s:%d', upnp.address, upnp.port),
      'MAN: "ssdp:discover"',
      this.msg('MX: %d', upnp.searchTimeout),
      'ST: upnp:rootdevice',
      ''
    ].join('\r\n'));
    socket.on('message', (buffer, rinfo) => {
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
          this.debug('upnp search: found %s', address);
          this.emit('upnpDeviceFound', address, response);
        }
        upnp.devices[address] = response;
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
      for (const line of lines) {
        let fields = line.split(': ');
        if (fields.length === 2) {
          response[fields[0].toLowerCase()] = fields[1];
        } else {                                                // HACK
          fields = line.split(':');                             // HACK
          if (fields.length === 2) {                            // HACK
            response[fields[0].toLowerCase()] = fields[1];      // HACK
          }                                                     // HACK
        }
      }
    }
    return response;
  }
};
