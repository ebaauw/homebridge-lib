// homebridge-lib/lib/RestClient.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2020 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../index')

const debug = require('debug')

let id = 0

/** Class for a REST API client.
  * @class
  * @extends HttpClient
  */
class RestClient extends homebridgeLib.HttpClient {
  /** Create a new instance of a REST API client.
    *
    * @param {object} params - Parameters.
    * @param {?function} params.checkCertificate - Callback function to check
    * the server's (self-signed) certificate.
    * @param {boolean} [params.https=false] - Use HTTPS (instead of HTTP).
    * @param {boolean} [params.ipv6=false] - Use IPv6 (instead of IPv4).
    * @param {?object} params.headers - Set HTTP request headers.
    * @param {string} params.host - Server hostname and port.
    * <br>Default: `localhost`.
    * @param {string} params.name - Display name for the HTTP server.
    * @param {string} params.path - Server base path.
    * @param {timeout} params.timeout - Request timeout (in seconds).
    */
  constructor (params = {}) {
    const _debug = debug('RestClient' + ++id)
    _debug('constructor(%j)', params)
    if (params.headers == null) {
      params.headers = { Accept: 'application/json' }
    } else if (params.headers.Accept == null) {
      params.headers.Accept = 'application/json'
    } else {
      params.headers.Accept += ', application/json'
    }
    super(params)
    this.__debug = _debug
    this.__debug('constructor(%j) => %j', params, this._options)
  }

  /** Issue a REST API request.
    *
    * @param {string} method - The method for the request.
    * @param {string} resource - The resource for the request.
    * @param {?object} body - The body for the request.
    * @return {object} response - The response.
    */
  async _request (method, resource, body = null) {
    this.__debug('request(%s, %s, %j)', method, resource, body)
    if (body != null) {
      body = JSON.stringify(body)
    }
    const result = await super._request(method, resource, body)
    const obj = JSON.parse(result)
    this.__debug('request(%s, %s, %j) => %j', method, resource, body, obj)
    return obj
  }
}

module.exports = RestClient
