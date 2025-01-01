// homebridge-deconz/homebridge-lib/UiServer.js
//
// Library for Homebridge plugins.
// Copyright © 2022-2025 Erik Baauw. All rights reserved.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { format } from 'node:util'

// Somehow this causes Homebridge to crash with SIGTERM after ~9 seconds.
import { HomebridgePluginUiServer } from '@homebridge/plugin-ui-utils'

import { formatError } from 'hb-lib-tools'
import { chalk } from 'hb-lib-tools/chalk'
import { HttpClient } from 'hb-lib-tools/HttpClient'

/** Server for dynamic configuration settings through Homebridge UI.
  * <br>See {@link UiServer}.
  * @name UiServer
  * @type {Class}
  * @memberof module:homebridge-lib
  */

/** Server for handling Homebridge Plugin UI requests.
  *
  * See {@link https://github.com/homebridge/plugin-ui-utils plugin-ui-utils}.
  *
  * The Homebridge Plugin UI Server runs in a separate process, which is spawned
  * by the Homebridge UI when the plugin _Settings_ are opened.
  * It implements an {@link HttpClient} to connect to the HTTP server provided
  * by {@link Platform} to change plugin settings dynamically.
  *
  * `UiServer` implemensts the following requests, which are documented as events:
  * - {@link UiServer#event:get get} - Send a GET request to the plugin instance.
  * - {@link UiServer#event:put put} - Send a put request to the plugin instance.
  * - {@link UiServer#event:cachedAccessories cachedAccessories} - Get the
  * cachedAccessories for a (child) bridge instance.
  * @extends HomebridgePluginUiServer
  */
class UiServer extends HomebridgePluginUiServer {
  constructor () {
    super()
    this.clients = {}

    /** Do a GET request to the plugin instance.
      * @event UiServer#get
      * @type {object}
      * @property {integer} uiPort - The port of the plugin instance UI server.
      * @property {string} resource - The requested resource.
      * @returns {*} - The response body.
      */
    this.onRequest('get', async (params) => {
      try {
        const { uiPort, path } = params
        const client = this._getClient(uiPort)
        const { body } = await client.get(path)
        return body
      } catch (error) {
        if (!(error instanceof HttpClient.HttpError)) {
          this.error(error)
        }
      }
    })

    /** Do a PUT request to the plugin instance.
      * @event UiServer#put
      * @param {object}
      * @property {integer} uiPort - The port of the plugin instance UI server.
      * @property {string} resource - The requested resource.
      * @property {*} body - The body of the request.
      * @returns {HttpResponse} - The response.
      */
    this.onRequest('put', async (params) => {
      try {
        const { uiPort, path, body } = params
        const client = this._getClient(uiPort)
        const response = await client.put(path, JSON.stringify(body))
        return response
      } catch (error) {
        if (!(error instanceof HttpClient.HttpError)) {
          this.error(error)
        }
      }
    })

    /** Get the cached accessories for a single (child) bridge instance.
      *
      * This endpoint is needed because `homebridge.getCachedAccessories()` from
      * `plugin-ui-utils` doesn't indicate to which child bridge an accessory
      * belongs.
      * @event UiServer#cachedAccessories
      * @type {object}
      * @property {?string} username - The virtual MAC address of the child
      * bridge.  Use `null` for the main bridge.
      * @returns {Object} cachedAccessories - The cached accessories.
      */
    this.onRequest('cachedAccessories', async (params) => {
      try {
        const { username } = params
        let fileName = 'cachedAccessories'
        if (username != null) {
          fileName += '.' + username.replace(/:/g, '').toUpperCase()
        }
        const fullFileName = join(
          this.homebridgeStoragePath,
          'accessories',
          fileName
        )
        const json = await readFile(fullFileName)
        const cachedAccessories = JSON.parse(json)
        return cachedAccessories
      } catch (error) {
        this.error(error)
      }
      return []
    })
  }

  _getClient (uiPort) {
    if (this.clients[uiPort] == null) {
      this.clients[uiPort] = new HttpClient({
        host: 'localhost:' + uiPort,
        json: true,
        keepAlive: true
      })
      this.clients[uiPort]
        .on('error', (error) => {
          this.warn('request %d: %s', error.request.id, error)
        })
        .on('request', (request) => {
          if (request.body == null) {
            this.debug(
              'request %d: %s %s', request.id, request.method, request.resource
            )
          } else {
            this.debug(
              'request %d: %s %s %j', request.id,
              request.method, request.resource, request.body
            )
          }
        })
        .on('response', (response) => {
          this.vdebug(
            'request %d: response: %j', response.request.id, response.body
          )
          this.debug(
            'request %d: %s %s', response.request.id,
            response.statusCode, response.statusMessage
          )
        })
    }
    return this.clients[uiPort]
  }

  // ===== Logging =============================================================

  /** Print debug message to stdout.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  debug (format, ...args) {
    this._log({ chalk: chalk.grey }, format, ...args)
  }

  /** Print error message to stdout.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  error (format, ...args) {
    this._log({ label: 'error', chalk: chalk.bold.red }, format, ...args)
  }

  /** Print log message to stdout.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  log (format, ...args) {
    this._log({}, format, ...args)
  }

  /** Print verbose debug message to stdout.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  vdebug (format, ...args) {
    this._log({ chalk: chalk.grey }, format, ...args)
  }

  /** Print very verbose debug message to stdout.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  vvdebug (format, ...args) {
    this._log({ chalk: chalk.grey }, format, ...args)
  }

  /** Print warning message to stdout.
    * @param {string|Error} format - The printf-style message or an instance of
    * [Error](https://nodejs.org/dist/latest-v14.x/docs/api/errors.html#errors_class_error).
    * @param {...string} args - Arguments to the printf-style message.
    */
  warn (format, ...args) {
    this._log({ label: 'warning', chalk: chalk.yellow }, format, ...args)
  }

  // Do the heavy lifting for debug(), error(), fatal(), log(), and warn(),
  // taking into account the options, and errors vs exceptions.
  _log (params = {}, ...args) {
    const output = process.stdout
    let message = ''

    // If last argument is Error convert it to string.
    if (args.length > 0) {
      let lastArg = args.pop()
      if (lastArg instanceof Error) {
        lastArg = formatError(lastArg, true)
      }
      args.push(lastArg)
    }

    // Format message.
    if (args[0] == null) {
      message = ''
    } else if (typeof args[0] === 'string') {
      message = format(...args)
    } else {
      message = format('%o', ...args)
    }

    // Handle colours.
    if (params.chalk != null) {
      message = params.chalk(message)
    }

    output.write(message)
  }
}

export { UiServer }
