// homebridge-lib/lib/RestClient.js
//
// Library for homebridge plug-ins.
// Copyright © 2018 Erik Baauw. All rights reserved.
//
// REST API client connection.

'use strict'

const debug = require('debug')
const request = require('request')

const homebridgeLib = {
  OptionParser: require('./OptionParser')
}

let id = 0

module.exports = class RestClient {
  // ===== Constructor =========================================================

  constructor (options = {}) {
    this._debug = debug('RestClient' + ++id)
    this._debug('constructor(%j)', options)
    this._options = {
      https: true,
      hostname: 'localhost',
      ipv6: false,
      keepalive: false,
      port: 80,
      path: '',
      timeout: 5
    }
    const optionParser = new homebridgeLib.OptionParser(this._options)
    optionParser.hostKey()
    optionParser.boolKey('https')
    optionParser.boolKey('ipv6')
    optionParser.boolKey('keepalive')
    optionParser.stringKey('name', true)
    optionParser.stringKey('path', true)
    optionParser.intKey('timeout', 1, 60)
    optionParser.parse(options)
    let host = this._options.hostname
    if (this._options.port !== 80) {
      host += ':' + this._options.port
    }
    if (this._options.name == null) {
      this._options.name = host
    }
    this._options.url = this._options.https ? 'https://' : 'http://'
    this._options.url += host
    if (this._options.path !== '') {
      this._options.url += '/' + this._options.path
    }
    this._debug('constructor() => %j', this._options)
  }

  setOptions (options) {
    homebridgeLib.OptionParser.toObject(options)
  }

  // ===== Public methods ======================================================

  // Retrieve resource.
  async get (resource = '/') {
    return this._request('GET', resource)
  }

  // Update resource.
  async put (resource, body) {
    return this._request('PUT', resource, body)
  }

  // Create resource.
  async post (resource, body) {
    return this._request('POST', resource, body)
  }

  // Delete resource.
  async delete (resource, body) {
    return this._request('DELETE', resource, body)
  }

  // ===== Private methods =====================================================

  // Issue REST API request.
  async _request (method, resource, body = null) {
    const methods = ['GET', 'PUT', 'POST', 'DELETE']
    if (!methods.includes(method)) {
      throw new TypeError(`${method}: invalid method`)
    }
    resource = homebridgeLib.OptionParser.toPath(resource, true)
    if (body != null) {
      body = homebridgeLib.OptionParser.toObject(body)
    }
    return new Promise((resolve, reject) => {
      const requestObj = {
        family: this._options.ipv6 ? 6 : 4,
        json: true,
        method: method,
        url: this._options.url + resource,
        timeout: 1000 * this._options.timeout
      }
      if (this._options.keepalive) {
        requestObj.headers = { 'Connection': 'keep-alive' }
      }
      if (body) {
        requestObj.body = body
      }
      this._debug('request(%j)', requestObj)
      request(requestObj, (err, response) => {
        this._debug('request(%j) => %j', requestObj, response)
        if (err) {
          return reject(err)
        }
        if (response.statusCode !== 200) {
          return reject(new Error(
            `${this._options.name}: http status ${response.statusCode} on ${method} ${resource}`
          ))
        }
        return resolve(response.body)
      })
    })
  }
}
