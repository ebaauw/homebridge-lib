// homebridge-lib/lib/UpnpClient.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2022 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

const dgram = require('dgram')
const events = require('events')

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

/** Universal Plug and Play client.
  * @extends EventEmitter
  */
class UpnpClient extends events.EventEmitter {
  /** Create a new instance of a Universal Plug and Play client.
    * @param {object} params - Paramters.
    * @param {function} [params.filter=() => { return true }] - Function to
    * filter which UPnP messages should result in a
    * {@link UpnpClient#event:deviceAlive deviceAlive} or a
    * {@link UpnpClient#event:deviceFound deviceFound} event.
    * @param {integer} [params.timemout=5] - Timeout (in seconds) for
    * {@link UpnpClient@search search()} to listen for responses.
    * @param {string} [params.class='upnp:rootdevice'] - Filter on class which UPnP
    * messages should result in a
    * {@link UpnpClient#event:deviceAlive deviceAlive} or a
    * {@link UpnpClient#event:deviceFound deviceFound} event.
    */
  constructor (params = {}) {
    super()
    this._options = {
      filter: () => { return true },
      hostname: '239.255.255.250',
      port: 1900,
      timeout: 5,
      class: 'upnp:rootdevice'
    }
    const optionParser = new homebridgeLib.OptionParser(this._options)
    optionParser.functionKey('filter')
    // optionParser.hostKey() // TODO: need global listener per hostname.
    optionParser.stringKey('class', true)
    optionParser.intKey('timeout', 1, 60)
    optionParser.parse(params)
    this.requestId = 0
  }

  _onError (error) {
    listener.socket = null
    /** Emitted in case of error.
      * @event UpnpClient#error
      * @param {Error} error - The error.
      */
    this.emit('error', error)
  }

  _onListening () {
    if (listener.init === this) {
      listener.host = listener.socket.address().address +
        ':' + listener.socket.address().port
      listener.socket.addMembership(this._options.hostname)
      delete listener.init
    }
    /** Emitted when listening to UPnP alive broadcasts.
      * @event UpnpClient#listening
      * @param {string} host - IP address and port listening on.
      */
    this.emit('listening', listener.host)
  }

  _onMessage (buffer, rinfo) {
    const rawMessage = buffer.toString().trim()
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
      /** Emitted for each alive message received, that passes the filers.
        * @event UpnpClient#deviceAlive
        * @param {string} address - IP address of the device.
        * @param {object} message - The parsed message.
        * @param {string} rawMessage - The raw message.
        */
      this.emit('deviceAlive', rinfo.address, message, rawMessage)
    }
  }

  /** Listen for UPnP alive broadcast messages.
    */
  async listen () {
    if (listener.socket == null) {
      listener.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
      listener.init = this
      listener.socket.bind(this._options.port)
    } else if (listener.init != null) {
      const [host] = await events.once(listener.init, 'listening')
      this.emit('listening', host)
    } else {
      this.emit('listening', listener.host)
    }

    listener.socket
      .on('error', this._onError.bind(this))
      .on('listening', this._onListening.bind(this))
      .on('message', this._onMessage.bind(this))
  }

  /** Stop listening for UPnP alive broadcast messages.
    */
  async stopListen () {
    if (listener.socket != null) {
      listener.socket
        .removeListener('error', this._onError.bind(this))
        .removeListener('listening', this._onListening.bind(this))
        .removeListener('message', this._onMessage.bind(this))
      this.emit('stopListening', listener.host)
    }
  }

  /** Issue a UPnP search message and listen for responses.
    */
  search () {
    const socket = dgram.createSocket({ type: 'udp4' })
    const request = Buffer.from([
      'M-SEARCH * HTTP/1.1',
      `HOST: ${this._options.hostname}:${this._options.port}`,
      'MAN: "ssdp:discover"',
      `MX: ${this._options.timeout}`,
      `ST: ${this._options.class}`,
      ''
    ].join('\r\n'))
    let host

    socket
      .on('error', (error) => {
        this.emit('error', error)
      })
      .on('listening', () => {
        host = socket.address().address + ':' + socket.address().port
        /** Emitted when searching for UPnP devices.
          * @event UpnpClient#searching
          * @param {string} host - IP address and port listening on.
          */
        this.emit('searching', host)
      })
      .on('message', (buffer, rinfo) => {
        const rawMessage = buffer.toString().trim()
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
          /** Emitted for each response received, that passes the filers.
            * @event UpnpClient#deviceFound
            * @param {string} address - IP address of the device.
            * @param {object} message - The parsed message.
            * @param {string} rawMessage - The raw message.
            */
          this.emit('deviceFound', rinfo.address, message, rawMessage)
        }
      })

    const requestInfo = {
      host: this._options.hostname + ':' + this._options.port,
      id: ++this.requestId,
      method: 'M-SEARCH',
      resource: '*'
    }
    this.emit('request', requestInfo)
    socket.send(
      request, 0, request.length, this._options.port, this._options.hostname
    )
    setTimeout(() => {
      socket.close()
      /** Emitted when searching has finished.
        * @event UpnpClient#searchDone
        * @param {string} host - IP address and port listening on.
        */
      this.emit('searchDone', host)
    }, this._options.timeout * 1000)
  }
}

module.exports = UpnpClient
