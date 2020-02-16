// homebridge-lib/lib/HttpClient.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2020 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

const debug = require('debug')
const http = require('http')
const https = require('https')

let id = 0

/** Class for a HTTP client.
  *
  * @class
  */
class HttpClient {
  /** Create a new instance of an HTTP client.
    *
    * @param {object} params - Parameters.
    * @param {?function} params.checkCertificate - Callback function to check
    * the server's (self-signed) certificate.
    * @param {boolean} [params.https=false] - Use HTTPS (instead of HTTP).
    * @param {boolean} [params.ipv6=false] - Use IPv6 (instead of IPv4).
    * @param {?object} params.headers - Set HTTP request headers.
    * @param {string} params.host - Server hostname and port.
    * <br>Default: `localhost:80`.
    * @param {string} params.name - Display name for the HTTP server.
    * @param {string} params.path - Server base path.
    * @param {timeout} params.timeout - Request timeout (in seconds).
    */
  constructor (params = {}) {
    this._debug = debug('HttpClient' + ++id)
    this._debug('constructor(%j)', params)
    this._options = {
      headers: {},
      hostname: 'localhost',
      path: '',
      port: 80,
      timeout: 5
    }
    const optionParser = new homebridgeLib.OptionParser(this._options)
    optionParser.functionKey('checkCertificate')
    optionParser.hostKey()
    optionParser.boolKey('https')
    optionParser.boolKey('ipv6')
    optionParser.boolKey('json')
    optionParser.objectKey('headers')
    optionParser.stringKey('name', true)
    optionParser.stringKey('path', true)
    optionParser.intKey('timeout', 1, 60)
    optionParser.parse(params)
    this._http = this._options.https ? https : http
    let host = this._options.hostname
    if (this._options.port !== 80) {
      host += ':' + this._options.port
    }
    if (this._options.name == null) {
      this._options.name = host
    }
    this._options.url = this._options.https ? 'https://' : 'http://'
    this._options.url += host
    this._debug('constructor(%j) => %j', params, this._options)
  }

  /** Server (base) path.
    * @type {string}
    */
  get path () { return this._options.path }
  set path (value) {
    this._options.path = homebridgeLib.OptionParser.toString(value, true)
  }

  // ===== Public methods ======================================================

  /** GET request.
    * @params {string} [resource='/'] - The resource.
    * @returns {string} - The response.
    */
  async get (resource = '/') {
    return this._request('GET', resource)
  }

  /** PUT request.
    * @params {!string} resource - The resource.
    * @param {?string} body - The body for the request.
    * @returns {string} - The response.
    */
  async put (resource, body) {
    return this._request('PUT', resource, body)
  }

  /** POST request.
    * @params {!string} resource - The resource.
    * @param {?string} body - The body for the request.
    * @returns {string} - The response.
    */
  async post (resource, body) {
    return this._request('POST', resource, body)
  }

  /** DELETE request.
    * @params {!string} resource - The resource.
    * @param {?string} body - The body for the request.
    * @returns {string} - The response.
    */
  async delete (resource, body) {
    return this._request('DELETE', resource, body)
  }

  // ===== Private methods =====================================================

  /** Issue a HTTP request.
    * @param {string} method - The method for the request.
    * @param {string} resource - The resource for the request.
    * @param {?string} body - The body for the request.
    * @return {string} response - The response.
    */
  async _request (method, resource, body = null) {
    this._debug('request(%s, %s, %j)', method, resource, body)
    if (!http.METHODS.includes(method)) {
      throw new TypeError(`${method}: invalid method`)
    }
    resource = homebridgeLib.OptionParser.toPath('resource', resource, true)
    const url = this._options.url + this._options.path + resource
    const options = {
      headers: this._options.headers,
      family: this._options.ipv6 ? 6 : 4,
      method: method,
      timeout: 1000 * this._options.timeout
    }
    if (this._options.checkCertificate != null) {
      options.rejectUnauthorized = false
    }
    if (body != null) {
      options.body = homebridgeLib.OptionParser.toString(body)
    }
    return new Promise((resolve, reject) => {
      const request = this._http.request(url, options, (response) => {
        if (this._options.checkCertificate != null) {
          try {
            this._options.checkCertificate(response.socket.getPeerCertificate())
          } catch (error) {
            reject(error)
          }
        }
        if (response.statusCode !== 200) {
          const code = response.statusCode
          const msg = http.STATUS_CODES[code]
          return reject(new Error(
            `${this._options.name}: http status ${code} - ${msg} on ${method} ${resource}`
          ))
        }
        let s = ''
        response.on('data', (chunk) => { s += chunk.toString() })
        response.on('end', () => {
          this._debug('request(%s, %s, %j) => %j', method, resource, body, s)
          resolve(s)
        })
      })
      request.on('error', (error) => { reject(error) })
      request.end()
    })
  }
}

module.exports = HttpClient
