// homebridge-lib/lib/UpnpClient.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2019 Erik Baauw. All rights reserved.
//
// UPnP monitor.

'use strict'

const homebridgeLib = require('../index')

const debug = require('debug')
const dgram = require('dgram')
const events = require('events')

let id = 0

const listener = {}

// Convert raw UPnP message to message object.
function convert (rawMessage) {
  const message = {}
  const lines = rawMessage.toString().trim().split('\r\n')
  if (lines && lines[0]) {
    message.status = lines[0]
    for (const line of lines) {
      const fields = line.split(': ')
      if (fields.length === 2) {
        message[fields[0].toLowerCase()] = fields[1]
      }
    }
  }
  return message
}

module.exports = class UpnpClient extends events.EventEmitter {
  constructor (options = {}) {
    super()
    this._debug = debug('UpnpClient' + ++id)
    this._debug('constructor(%j)', options)
    this._options = {
      filter: () => { return true },
      hostname: '239.255.255.250',
      port: 1900,
      timeout: 5,
      class: 'upnp:rootdevice'
    }
    const optionParser = new homebridgeLib.OptionParser(this._options)
    optionParser.functionKey('filter', true)
    optionParser.hostKey()
    optionParser.stringKey('class', true)
    optionParser.intKey('timeout', 1, 60)
    optionParser.parse(options)
    this._debug('constructor() => %j', this._options)
  }

  // Listen for UPnP alive broadcast messages.
  // Emits the following events:
  // - 'deviceAlive' (address, obj, message)
  // - 'listening' (host)
  // - 'error' (err)
  listen () {
    if (listener.socket == null) {
      listener.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
      listener.init = this
      listener.socket.bind(this._options.port)
    } else if (listener.init != null) {
      events.once(listener.init, 'listening')
        .then((host) => {
          this.emit('listening', host)
        })
        .catch((error) => { this.emit('error', error) })
    } else {
      this.emit('listening', listener.host)
    }

    listener.socket.on('message', (buffer, rinfo) => {
      const rawMessage = buffer.toString().trim()
      this._debug('message from %s', rinfo.address)
      const message = convert(rawMessage)
      if (
        message.status !== 'NOTIFY * HTTP/1.1' ||
        message.nts !== 'ssdp:alive'
      ) {
        return
      }
      if (
        this._options.class !== 'ssdp:all' &&
        message.nt !== this._options.class
      ) {
        return
      }
      if (this._options.filter(message)) {
        this.emit('deviceAlive', rinfo.address, message, rawMessage)
      }
    })

    listener.socket.on('error', (error) => {
      listener.socket = null
      this._debug('error: %j', error)
      this.emit('error', error)
    })

    listener.socket.on('listening', () => {
      listener.host = listener.socket.address().address +
        ':' + listener.socket.address().port
      this._debug('listening to %s', listener.host)
      if (listener.init != null) {
        this._debug('joining %s', this._options.hostname)
        listener.socket.addMembership(this._options.hostname)
        delete listener.init
      }
      this.emit('listening', listener.host)
    })
  }

  // Issue a UPnP search message and listen for responses.
  // Emits the following events:
  // - 'deviceFound' (address, obj, message)
  // - 'searching' (host)
  // - 'searchDone' ()
  // - 'error' (error)
  search () {
    const socket = dgram.createSocket({ type: 'udp4' })
    const request = Buffer.from([
      'M-SEARCH * HTTP/1.1',
      `HOST: ${this._options.hostname}:${this._options.port}`,
      `MAN: "ssdp:discover"`,
      `MX: ${this._options.timeout}`,
      `ST: ${this._options.class}`,
      ''
    ].join('\r\n'))

    socket.on('message', (buffer, rinfo) => {
      const rawMessage = buffer.toString().trim()
      this._debug('message from %s', rinfo.address)
      const message = convert(rawMessage)
      if (message.status !== 'HTTP/1.1 200 OK') {
        return
      }
      if (
        this._options.class !== 'ssdp:all' &&
        message.st !== this._options.class
      ) {
        return
      }
      if (this._options.filter(message)) {
        this.emit('deviceFound', rinfo.address, message, rawMessage)
      }
    })

    socket.on('error', (error) => {
      this._debug('error: %j', error)
      this.emit('error', error)
    })

    socket.on('listening', () => {
      const host = socket.address().address + ':' + socket.address().port
      this._debug('listening to %s', host)
      this.emit('searching', host)
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
      this.emit('searchDone')
    }, this._options.timeout * 1000)
  }
}
