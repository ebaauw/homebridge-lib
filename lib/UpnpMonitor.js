// homebridge-lib/lib/UpnpMonitor.js
//
// Library for homebridge plug-ins.
// Copyright © 2018 Erik Baauw. All rights reserved.
//
// UPnP monitor.

'use strict'

const debug = require('debug')
const dgram = require('dgram')
const homebridgeLib = require('../index')

let id = 0

// Convert UPnP message to object.
function convert (message) {
  const obj = {}
  const lines = message.toString().trim().split('\r\n')
  if (lines && lines[0]) {
    obj.status = lines[0]
    for (const line of lines) {
      const fields = line.split(': ')
      if (fields.length === 2) {
        obj[fields[0].toLowerCase()] = fields[1]
      }
    }
  }
  return obj
}

module.exports = class UpnpMonitor {
  constructor (parent, options = {}) {
    this._debug = debug('UpnpMonitor', ++id)
    this._debug('constructor(%s, %j)', parent.name, options)
    if (!parent || !parent.emit || typeof parent.emit !== 'function') {
      throw new TypeError('parent is not an EventEmitter')
    }
    this.parent = parent
    this._options = {
      hostname: '239.255.255.250',
      port: 1900,
      timeout: 5,
      class: 'upnp:rootdevice'
    }
    const optionParser = new homebridgeLib.OptionParser(this._options)
    optionParser.hostKey()
    optionParser.stringKey('class', true)
    optionParser.intKey('timeout', 1, 60)
    optionParser.parse(options)
    this._debug('constructor() => %j', this._options)
  }

  // Listen for UPnP alive broadcast messages.
  // Emits the following events:
  // - upnpDeviceAlive (address, obj, message)
  // - upnpListening (host)
  // - upnpError (err)
  listen () {
    const socket = dgram.createSocket({type: 'udp4', reuseAddr: true})

    socket.on('message', (buffer, rinfo) => {
      const message = buffer.toString().trim()
      this._debug('message from %s', rinfo.address)
      const obj = convert(message)
      if (obj.status !== 'NOTIFY * HTTP/1.1' || obj.nts !== 'ssdp:alive') {
        return
      }
      if (
        this._options.class !== 'ssdp:all' &&
        obj.nt !== this._options.class
      ) {
        return
      }
      this.parent.emit('upnpDeviceAlive', rinfo.address, obj, message)
    })

    socket.on('error', (error) => {
      this._debug('error: %j', error)
      this.parent.emit('upnpError', error)
    })

    socket.on('listening', () => {
      const host = socket.address().address + ':' + socket.address().port
      this._debug('listening to %s', host)
      this._debug('joining %s', this._options.hostname)
      socket.addMembership(this._options.hostname)
      this.parent.emit('upnpListening', host)
    })

    socket.bind(this._options.port)
  }

  // Issue a UPnP search message and listen for responses.
  // Emits the following events:
  // - upnpDeviceFound (address, obj, message)
  // - upnpSearching (host)
  // - upnpSearchDone ()
  // - upnpError (err)
  search () {
    const socket = dgram.createSocket({type: 'udp4'})
    const request = Buffer.from([
      'M-SEARCH * HTTP/1.1',
      `HOST: ${this._options.hostname}:${this._options.port}`,
      `MAN: "ssdp:discover"`,
      `MX: ${this._options.timeout}`,
      `ST: ${this._options.class}`,
      ''
    ].join('\r\n'))

    socket.on('message', (buffer, rinfo) => {
      const message = buffer.toString().trim()
      this._debug('message from %s', rinfo.address)
      const obj = convert(message)
      if (obj.status !== 'HTTP/1.1 200 OK') {
        return
      }
      if (
        this._options.class !== 'ssdp:all' &&
        obj.st !== this._options.class
      ) {
        return
      }
      this.parent.emit('upnpDeviceFound', rinfo.address, obj, message)
    })

    socket.on('error', (error) => {
      this._debug('error: %j', error)
      this.parent.emit('upnpError', error)
    })

    socket.on('listening', () => {
      const host = socket.address().address + ':' + socket.address().port
      this._debug('listening to %s', host)
      this.parent.emit('upnpSearching', host)
    })

    this._debug(
      'sending search to %s:%d', this._options.hostname, this._options.port
    )
    socket.send(
      request, 0, request.length, this._options.port, this._options.hostname
    )
    setTimeout(() => {
      this._debug('timeout')
      socket.close()
      this.parent.emit('upnpSearchDone')
    }, this._options.timeout * 1000)
  }
}
