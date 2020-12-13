// homebridge-lib/lib/HttpClient.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2020 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

const events = require('events')
const http = require('http')
const https = require('https')
const util = require('util')

const formatError = homebridgeLib.CommandLineTool.formatError

function newError (...args) {
  // If last argument is Error convert it to string.
  if (args.length > 0) {
    let lastArg = args.pop()
    if (lastArg instanceof Error) {
      lastArg = formatError(lastArg)
    }
    args.push(lastArg)
  }
  return new Error(util.format(...args))
}

/** Class for a HTTP client.
  * @class
  * @extends EventEmitter
  */
class HttpClient extends events.EventEmitter {
  /** Create a new instance of a client to an HTTP server.
    *
    * @param {object} params - Parameters.
    * @param {?function} params.checkCertificate - Callback function to check
    * the server's (self-signed) certificate.
    * @param {?object} params.headers - Default HTTP headers for each request.
    * @param {string} [params.host='localhost:80'] - Server hostname and port.
    * @param {boolean} [params.https=false] - Use HTTPS (instead of HTTP).
    * @param {boolean} [params.ipv6=false] - Use IPv6 (instead of IPv4).
    * @param {boolean} [params.json=false] - Request and response body in JSON.
    * @param {boolean} [params.keepAlive=false] - Keep server connection(s) open.
    * @param {integer} [params.maxSockets=Infinity] - Throttle requests to maximum
    * number of parallel connections.
    * @param {?string} params.path - Server base path.
    * @param {?string} params.suffix - Suffix to append after resource
    * e.g. for authentication of the request.
    * @param {boolean} [params.text=false] - Convert response body to text.
    * @param {integer} [params.timeout=5] - Request timeout (in seconds).
    */
  constructor (params = {}) {
    super()
    this._params = {
      headers: {},
      hostname: 'localhost',
      keepAlive: false,
      maxSockets: Infinity,
      path: '',
      suffix: '',
      timeout: 5,
      validStatusCodes: [200]
    }
    this._requestId = 0
    const optionParser = new homebridgeLib.OptionParser(this._params)
    optionParser.functionKey('checkCertificate')
    optionParser.hostKey()
    optionParser.boolKey('https')
    optionParser.boolKey('ipv6')
    optionParser.objectKey('headers')
    optionParser.boolKey('json')
    optionParser.boolKey('keepAlive')
    optionParser.intKey('maxSockets', 1)
    optionParser.stringKey('path')
    optionParser.stringKey('suffix')
    optionParser.boolKey('text', true)
    optionParser.intKey('timeout', 1, 60)
    optionParser.arrayKey('validStatusCodes')
    optionParser.parse(params)
    this._setOptions()
    this._setUrl()
  }

  _setOptions () {
    this._http = this._params.https ? https : http
    this._options = {
      agent: new this._http.Agent({
        keepAlive: this._params.keepAlive,
        maxSockets: this._params.maxSockets
      }),
      family: this._params.ipv6 ? 6 : 4,
      headers: Object.assign({}, this._params.headers),
      timeout: 1000 * this._params.timeout
    }
    if (this._params.checkCertificate != null) {
      this._options.rejectUnauthorized = false
    }
    if (this._params.json) {
      const json = 'application/json; charset=utf-8'
      if (this._options.headers == null) {
        this._options.headers = {}
      }
      this._options.headers['Content-Type'] = json
      if (this._options.headers.Accept == null) {
        this._options.headers.Accept = json
      } else {
        this._options.headers.Accept += ', ' + json
      }
    }
  }

  _setUrl () {
    this._params.url = this._params.https ? 'https://' : 'http://'
    this._params.url += this._params.hostname
    if (this._params.port != null) {
      this._params.url += ':' + this._params.port
    }
    this._params.url += this._params.path
  }

  /** Server hostname and port.
    * @type {string}
    */
  get host () {
    let host = this._params.hostname
    if (this._params.port != null) {
      host += ':' + this._params.port
    }
    return host
  }

  set host (value) {
    const obj = homebridgeLib.OptionParser.toHost('host', value)
    this._params.hostname = obj.hostname
    this._params.port = obj.port
    this._setUrl()
  }

  /** Server (base) path.
    * @type {string}
    */
  get path () { return this._params.path }
  set path (value) {
    this._params.path = value == null
      ? ''
      : homebridgeLib.OptionParser.toPath('path', value)
    this._setUrl()
  }

  /** Timeout (in sec).
    * @type {integer}
    */
  get timeout () { return this._params.timeout }
  set timeout (value) {
    this._params.timeout = homebridgeLib.OptionParser.toInt(
      'timeout', value, 1, 60
    )
    this._options.timeout = 1000 * this._params.timeout
  }

  /** GET request.
    * @param {string} [resource='/'] - The resource.
    * @param {?object} headers - Additional headers for the request.
    * @return {object} response - The response.<br>
    * <H5>Properties:</H5>
    *
    * name | type | attributes | description
    * ---- | ---- | ---------- | -----------
    * `body` | Buffer|string|object | &lt;nullable&gt; | The response body.
    * `headers` | object | | The response headers.
    * `statusCode` | int | | The HTTP status code (e.g. 200).
    * `statusMessage` | string | | The HTTP status (e.g. "OK").
    * @throws Error In case of error.
    */
  async get (resource = '/', headers = {}) {
    return this.request('get', resource, undefined, headers)
  }

  /** PUT request.
    * @param {!string} resource - The resource.
    * @param {?Buffer|string|object} body - The body for the request.
    * @param {?object} headers - Additional headers for the request.
    * @return {object} response - The response.<br>
    * <H5>Properties:</H5>
    *
    * name | type | attributes | description
    * ---- | ---- | ---------- | -----------
    * `body` | Buffer|string|object | &lt;nullable&gt; | The response body.
    * `headers` | object | | The response headers.
    * `statusCode` | int | | The HTTP status code (e.g. 200).
    * `statusMessage` | string | | The HTTP status (e.g. "OK").
    * @throws Error In case of error.
    */
  async put (resource, body, headers) {
    return this.request('put', resource, body, headers)
  }

  /** POST request.
    * @param {!string} resource - The resource.
    * @param {?Buffer|string|object} body - The body for the request.
    * @param {?object} headers - Additional headers for the request.
    * @return {object} response - The response.<br>
    * <H5>Properties:</H5>
    *
    * name | type | attributes | description
    * ---- | ---- | ---------- | -----------
    * `body` | Buffer|string|object | &lt;nullable&gt; | The response body.
    * `headers` | object | | The response headers.
    * `statusCode` | int | | The HTTP status code (e.g. 200).
    * `statusMessage` | string | | The HTTP status (e.g. "OK").
    * @throws Error In case of error.
    */
  async post (resource, body, headers) {
    return this.request('post', resource, body, headers)
  }

  /** DELETE request.
    * @param {!string} resource - The resource.
    * @param {?Buffer|string|object} body - The body for the request.
    * @param {?object} headers - Additional headers for the request.
    * @return {object} response - The response.<br>
    * <H5>Properties:</H5>
    *
    * name | type | attributes | description
    * ---- | ---- | ---------- | -----------
    * `body` | Buffer|string|object | &lt;nullable&gt; | The response body.
    * `headers` | object | | The response headers.
    * `statusCode` | int | | The HTTP status code (e.g. 200).
    * `statusMessage` | string | | The HTTP status (e.g. "OK").
    * @throws Error In case of error.
    */
  async delete (resource, body, headers) {
    return this.request('delete', resource, body, headers)
  }

  /** Issue a HTTP request.
    * @param {string} method - The method for the request.
    * @param {!string} resource - The resource for the request.
    * @param {?Buffer|string|object} body - The body for the request.
    * @param {?object} headers - Additional headers for the request.
    * @return {object} response - The response.<br>
    * <H5>Properties:</H5>
    *
    * name | type | attributes | description
    * ---- | ---- | ---------- | -----------
    * `body` | Buffer|string|object | &lt;nullable&gt; | The response body.
    * `headers` | object | | The response headers.
    * `statusCode` | int | | The HTTP status code (e.g. 200).
    * `statusMessage` | string | | The HTTP status (e.g. "OK").
    * @throws Error In case of error.
    */
  async request (method, resource, body, headers = {}, suffix = '') {
    return new Promise((resolve, reject) => {
      method = homebridgeLib.OptionParser.toString('method', method, true)
        .toUpperCase()
      if (!http.METHODS.includes(method)) {
        throw new TypeError(`${method}: invalid method`)
      }
      resource = homebridgeLib.OptionParser.toString('resource', resource, true)
      if (body != null && !Buffer.isBuffer(body)) {
        body = this._params.json
          ? JSON.stringify(body)
          : homebridgeLib.OptionParser.toString('body', body)
      }
      const requestId = ++this._requestId
      const url = this._params.url + (resource === '/' ? '' : resource) +
                  this._params.suffix + suffix
      const options = Object.assign({ method: method }, this._options)
      const request = this._http.request(url, options)
      request.on('response', (response) => {
        const a = []
        response.on('data', (chunk) => { a.push(chunk) })
        response.on('end', () => {
          const buffer = Buffer.concat(a)

          if (!this._params.validStatusCodes.includes(response.statusCode)) {
            const error = newError(
              'http status %d %s', response.statusCode, response.statusMessage
            )
            error.statusCode = response.statusCode
            error.statusMessage = response.statusMessage
            request.emit('error', error)
            return
          }
          const result = {
            headers: response.headers,
            statusCode: response.statusCode,
            statusMessage: response.statusMessage
          }
          if (buffer != null) {
            if (
              this._params.json &&
              response.headers['content-type'].startsWith('application/json')
            ) {
              try {
                result.body = JSON.parse(buffer.toString('utf-8'))
              } catch (error) {
                request.emit(error)
                return
              }
            } else {
              result.body = this._params.text ? buffer.toString('utf-8') : buffer
            }
          }
          /** Emitted when response has been received from the http server.
            *
            * @event HttpClient#response
            * @param {integer} requestId - The ID of the request.
            * @param {integer} statusCode - HTTP status code.
            * @param {string} statusMessage - HTTP status message.
            * @param {*} body - The response body of the request.
            */
          this.emit(
            'response', requestId, response.statusCode, response.statusMessage,
            result.body
          )
          resolve(result)
        })
      })
      request.on('socket', (socket) => {
        /** Emitted when request has been sent to the http server.
          *
          * @event HttpClient#request
          * @param {integer} requestId - The ID of the request.
          * @param {string} method - Method of the request.
          * @param {string} resource - Resource of the request.
          * @param {*} body - The request body.
          * @param {string} url - The full URL of the request.
          */
        this.emit('request', requestId, method, resource, body, url)
      })
      request.on('timeout', () => {
        request.destroy(newError(
          '%s: timeout after %d seconds', request.host, this._params.timeout
        ))
      })
      request.on('error', (error) => {
        /** Emitted when an error has occurred.
          *
          * In addition to throwing, an `error` event is emitted to enable
          * detailed error messages, including the request.
          *
          * @event HttpClient#error
          * @param {Error} error - The error.
          * @param {integer} requestId - The ID of the request.
          * @param {string} method - Method of the request.
          * @param {string} resource - Resource of the request.
          * @param {*} body - The request body.
          * @param {string} url - The full URL of the request.
          */
        this.emit('error', error, requestId, method, resource, body, url)
        reject(error)
      })
      if (headers != null) {
        headers = homebridgeLib.OptionParser.toObject('headers', headers)
        for (const header in headers) {
          request.setHeader(header, headers[header])
        }
      }
      request.end(body)
    })
  }
}

module.exports = HttpClient
