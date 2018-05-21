// homebridge-lib/lib/WsMonitor.js
//
// Library for homebridge plug-ins.
// Copyright © 2018 Erik Baauw. All rights reserved.
//
// Websocket monitor.

'use strict'

const OptionParser = require('./OptionParser')
const WebSocket = require('ws')

module.exports = class WsMonitor {
  constructor (parent, options = {}) {
    if (!parent || !parent.emit || typeof parent.emit !== 'function') {
      throw new TypeError('parent is not an EventEmitter')
    }
    this.parent = parent
    this._options = {
      hostname: 'localhost',
      port: 443,
      retryTime: 10
    }
    const optionParser = new OptionParser(this._options)
    optionParser.hostKey()
    optionParser.intKey('retryTime', 0, 120)
    optionParser.boolKey('raw')
    optionParser.parse(options)
  }

  listen () {
    const url = 'ws://' + this._options.hostname + ':' + this._options.port
    const ws = new WebSocket(url)

    ws.on('open', () => {
      this.parent.emit('wsListening', url)
    })

    ws.on('message', (data, flags) => {
      try {
        const obj = JSON.parse(data)
        if (!this._options.raw) {
          if (obj.t === 'event') {
            switch (obj.e) {
              case 'changed':
                if (obj.r && obj.id && obj.state) {
                  const resource = '/' + obj.r + '/' + obj.id + '/state'
                  this.parent.emit('wsChanged', resource, obj.state)
                  return
                }
                if (obj.r && obj.id && obj.config) {
                  const resource = '/' + obj.r + '/' + obj.id + '/config'
                  this.parent.emit('wsChanged', resource, obj.config)
                  return
                }
                break
              case 'added':
                if (obj.r && obj.id) {
                  const resource = '/' + obj.r + '/' + obj.id
                  this.parent.emit('wsAdded', resource, obj[obj.r.slice(0, -1)])
                  return
                }
                break
              case 'scene-called':
                if (obj.gid && obj.scid) {
                  const resource = '/groups/' + obj.gid + '/scenes/' + obj.scid
                  this.parent.emit('wsSceneRecall', resource)
                  return
                }
                break
              default:
                break
            }
          }
        }
        this.parent.emit('wsNotification', obj)
      } catch (err) {
        this.parent.emit('wsError', err)
      }
    })

    ws.on('error', (error) => {
      this.parent.emit('wsError', error)
    })

    ws.on('close', () => {
      this.parent.emit('wsClosed')
      if (this._options.retryTime > 0) {
        setTimeout(this.listen.bind(this), this._options.retryTime * 1000)
      }
    })
  }
}
