// homebridge-lib/lib/HttpClient.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2020 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

const debug = require('debug')
const events = require('events')
const http = require('http')
const https = require('https')
const util = require('util')

let id = 0

/** Class for a HTTP client.
  * @class
  */
class HttpClient {
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
    * @param {string} params.name - Display name for the HTTP server.
    * @param {?string} params.path - Server base path.
    * @param {boolean} [params.text=false] - Convert response body to text.
    * @param {integer} [params.timeout=5] - Request timeout (in seconds).
    */
  constructor (params = {}) {
    this._debug = debug('HttpClient' + ++id)
    this._debug('constructor(%j)', params)
    this._params = {
      headers: {},
      hostname: 'localhost',
      keepAlive: false,
      maxSockets: Infinity,
      timeout: 5,
      validStatusCodes: [200]
    }
    const optionParser = new homebridgeLib.OptionParser(this._params)
    optionParser.functionKey('checkCertificate')
    optionParser.hostKey()
    optionParser.boolKey('https')
    optionParser.boolKey('ipv6')
    optionParser.objectKey('headers')
    optionParser.boolKey('json')
    optionParser.boolKey('keepAlive')
    optionParser.stringKey('name', true)
    optionParser.intKey('maxSockets', 1)
    optionParser.stringKey('path', true)
    optionParser.boolKey('text', true)
    optionParser.intKey('timeout', 1, 60)
    optionParser.arrayKey('validStatusCodes')
    optionParser.parse(params)
    this._http = this._params.https ? https : http
    this.path = this._params.path
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
      // const json = 'application/json'
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
    if (this._params.name == null) {
      this._params.name = this._params.hostname
    }
    this._debug('constructor(%j) => %o, %o', params, this._params, this._options)
  }

  /** Server (base) path.
    * @type {string}
    */
  get path () { return this._params.path }
  set path (value) {
    this._params.path = value == null
      ? ''
      : homebridgeLib.OptionParser.toPath('path', value, true)
    this._params.url = this._params.https ? 'https://' : 'http://'
    this._params.url += this._params.hostname
    if (this._params.port != null) {
      this._params.url += ':' + this._params.port
    }
    this._params.url += this._params.path
  }

  /** GET request.
    * @param {string} [resource='/'] - The resource.
    * @param {?object} headers - Additional headers for the request.
    * @return {object} response - The response.<br>
    * <H5>Properties:</H5>
    *
    * name | type | attributes | description
    * ---- | ---- | ---------- | -----------
    * `body` | Buffer | &lt;nullable&gt; | The response body.
    * `headers` | object | | The response headers.
    * `statusCode` | int | | The HTTP status code (e.g. 200).
    * `statusMessage` | string | | The HTTP status (e.g. "OK").
    * @throws Error In case of error.
    */
  async get (resource = '/', headers) {
    return this.request('GET', resource, undefined, headers)
  }

  /** PUT request.
    * @param {!string} resource - The resource.
    * @param {?Buffer|string} body - The body for the request.
    * @param {?object} headers - Additional headers for the request.
    * @return {object} response - The response.<br>
    * <H5>Properties:</H5>
    *
    * name | type | attributes | description
    * ---- | ---- | ---------- | -----------
    * `body` | Buffer | &lt;nullable&gt; | The response body.
    * `headers` | object | | The response headers.
    * `statusCode` | int | | The HTTP status code (e.g. 200).
    * `statusMessage` | string | | The HTTP status (e.g. "OK").
    * @throws Error In case of error.
    */
  async put (resource, body, headers) {
    return this.request('PUT', resource, body, headers)
  }

  /** POST request.
    * @param {!string} resource - The resource.
    * @param {?Buffer|string} body - The body for the request.
    * @param {?object} headers - Additional headers for the request.
    * @return {object} response - The response.<br>
    * <H5>Properties:</H5>
    *
    * name | type | attributes | description
    * ---- | ---- | ---------- | -----------
    * `body` | Buffer | &lt;nullable&gt; | The response body.
    * `headers` | object | | The response headers.
    * `statusCode` | int | | The HTTP status code (e.g. 200).
    * `statusMessage` | string | | The HTTP status (e.g. "OK").
    * @throws Error In case of error.
    */
  async post (resource, body, headers) {
    return this.request('POST', resource, body, headers)
  }

  /** DELETE request.
    * @param {!string} resource - The resource.
    * @param {?Buffer|string} body - The body for the request.
    * @param {?object} headers - Additional headers for the request.
    * @return {object} response - The response.<br>
    * <H5>Properties:</H5>
    *
    * name | type | attributes | description
    * ---- | ---- | ---------- | -----------
    * `body` | Buffer | &lt;nullable&gt; | The response body.
    * `headers` | object | | The response headers.
    * `statusCode` | int | | The HTTP status code (e.g. 200).
    * `statusMessage` | string | | The HTTP status (e.g. "OK").
    * @throws Error In case of error.
    */
  async delete (resource, body, headers) {
    return this.request('DELETE', resource, body, headers)
  }

  /** Issue a HTTP request.
    * @param {string} method - The method for the request.
    * @param {!string} resource - The resource for the request.
    * @param {?Buffer|string} body - The body for the request.
    * @param {?object} headers - Additional headers for the request.
    * @return {object} response - The response.<br>
    * <H5>Properties:</H5>
    *
    * name | type | attributes | description
    * ---- | ---- | ---------- | -----------
    * `body` | Buffer | &lt;nullable&gt; | The response body.
    * `headers` | object | | The response headers.
    * `statusCode` | int | | The HTTP status code (e.g. 200).
    * `statusMessage` | string | | The HTTP status (e.g. "OK").
    * @throws Error In case of error.
    */
  async request (method, resource, body, headers = {}) {
    this._debug('request(%s, %s, %j, %j)', method, resource, body, headers)
    if (!http.METHODS.includes(method)) {
      throw new TypeError(`${method}: invalid method`)
    }
    resource = homebridgeLib.OptionParser.toPath('resource', resource, true)
    if (body != null && !Buffer.isBuffer(body)) {
      body = this._params.json
        ? JSON.stringify(body)
        : homebridgeLib.OptionParser.toString('body', body)
    }
    const url = this._params.url + resource
    const options = Object.assign({ method: method }, this._options)
    const request = this._http.request(url, options)
    for (const header in headers) {
      request.setHeader(header, headers[header])
    }
    request.end(body)
    const [response] = await events.once(request, 'response')
    const a = []
    response.on('data', (chunk) => { a.push(chunk) })
    await events.once(response, 'end')
    const buffer = Buffer.concat(a)
    if (!this._params.validStatusCodes.includes(response.statusCode)) {
      throw new Error(util.format(
        '%s: %s %s: http status %d %s', this._params.name, method, resource,
        response.statusCode, response.statusMessage
      ))
    }
    const result = {
      headers: response.headers,
      statusCode: response.statusCode,
      statusMessage: response.statusMessage
    }
    if (buffer != null) {
      result.body = this._params.json
        ? JSON.parse(buffer.toString('utf-8'))
        : this._params.text
          ? buffer.toString('utf-8')
          : buffer
    }
    this._debug(
      'request(%s, %s, %j, %j) => %j',
      method, url, body, headers, result
    )
    return result
  }
}

module.exports = HttpClient
