// homebridge-lib/lib/AdaptiveLighting.js
//
// Library for Homebridge plugins.
// Copyright © 2020-2025 Erik Baauw. All rights reserved.

import { CharacteristicDelegate } from 'homebridge-lib/CharacteristicDelegate'

/* global BigInt */

const epoch = (new Date('2001-01-01T00:00:00Z')).valueOf()

// Types in TLV values for Adaptive Lighting.
const types = {
  1: { key: 'configuration', type: 'tlv' },
  1.1: { key: 'iid', type: 'uint' },
  1.2: { key: 'characteristic', type: 'uint' },
  2: { key: 'control', type: 'tlv' },
  2.1: { key: 'colorTemperature', type: 'tlv' },
  '2.1.1': { key: 'iid', type: 'uint' },
  '2.1.2': { key: 'transitionParameters', type: 'tlv' },
  '2.1.2.1': { type: 'hex' },
  '2.1.2.2': { key: 'startTime', type: 'date' },
  '2.1.2.3': { type: 'hex' },
  '2.1.3': { key: 'runtime', type: 'uint' },
  '2.1.5': { key: 'curve', type: 'tlv' },
  '2.1.5.1': { key: 'entries', type: 'tlv' },
  '2.1.5.1.1': { key: 'adjustmentFactor', type: 'float' },
  '2.1.5.1.2': { key: 'mired', type: 'float' },
  '2.1.5.1.3': { key: 'offset', type: 'uint' },
  '2.1.5.1.4': { key: 'duration', type: 'uint' },
  '2.1.5.2': { key: 'adjustmentIid', type: 'uint' },
  '2.1.5.3': { key: 'adjustmentRange', type: 'tlv' },
  '2.1.5.3.1': { key: 'min', type: 'uint' },
  '2.1.5.3.2': { key: 'max', type: 'uint' },
  '2.1.6': { key: 'updateInterval', type: 'uint' },
  '2.1.8': { key: 'notifyIntervalThreshold', type: 'uint' }
}

// Recursively parse TLV value into an object.
function parseTlv (path, buf) {
  path = path == null ? '' : path + '.'
  const result = {}
  for (let i = 0; i < buf.length;) {
    let type = buf[i++]
    let length = buf[i++]
    let value = buf.slice(i, i + length)
    i += length
    while (length === 255 && i < buf.length) {
      if (buf[i] === type) {
        i++
        length = buf[i++]
        value = Buffer.concat([value, buf.slice(i, i + length)])
        i += length
      }
    }
    type = path + type
    // console.error('type: %s, length: %d, value: %j', type, length, value)

    let key = type
    if (types[type] != null) {
      if (types[type].key != null) {
        key = types[type].key
      }
      switch (types[type].type) {
        case 'uint':
          if (length === 1) {
            value = value.readUInt8()
          } else if (length === 2) {
            value = value.readUInt16LE()
          } else if (length === 4) {
            value = value.readUInt32LE()
          } else if (length === 8) {
            value = Number(value.readBigUInt64LE())
          }
          break
        case 'float':
          if (length === 4) {
            value = value.readFloatLE()
          }
          break
        case 'date':
          if (length === 8) {
            value = new Date(Number(value.readBigUInt64LE()) + epoch).toISOString()
          }
          break
        case 'hex':
          value = value.toString('hex').toUpperCase()
          break
        case 'tlv':
          value = parseTlv(type, value)
          break
        default:
          break
      }
    } else if (length === 0) {
      // ignore empty value
      key = null
      value = null
    }

    if (key != null) {
      // Add key/value-pair to result.
      if (result[key] == null) {
        // New key: add key/value-pair.
        result[key] = value
      } else {
        // Duplicate key.
        if (!Array.isArray(result[key])) {
          // Turn value into array.
          result[key] = [result[key]]
        }
        // Add new value to value array.
        result[key].push(value)
      }
    }
  }
  return result
}

// Return a TLV buffer for given type and length, with empty value.
function tlvBuffer (type, length) {
  const buf = Buffer.alloc(2 + length)
  buf[0] = type
  buf[1] = length
  return buf
}

// Return a TLV buffer for given type with length 0.
function tlvFromNull (type) {
  return tlvBuffer(type, 0)
}

// Return a TLV buffer for given type and buffer value.
function tlvFromBuffer (type, value) {
  const buf = tlvBuffer(type, value.length)
  value.copy(buf, 2, 0)
  return buf
}

// Return a TLV buffer for given type and uint value.
function tlvFromUInt (type, value) {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64LE(BigInt(value))
  let length
  if (value > 0xFFFFFFFF) {
    length = 8
  } else if (value > 0xFFFF) {
    length = 4
  } else if (value > 0xFF) {
    length = 2
  } else {
    length = 1
  }
  return tlvFromBuffer(type, buf.slice(0, length))
}

// Return a TVL buffer for given type and hex string value.
function tlvFromHexString (type, value) {
  if (value == null) {
    return Buffer.alloc(0)
  }
  return tlvFromBuffer(type, Buffer.from(value, 'hex'))
}

/** Adaptive Lighting.
  * <br>See {@link AdaptiveLighting}.
  * @name AdaptiveLighting
  * @type {Class}
  * @memberof module:homebridge-lib
  */

/** Adaptive Lighting.
  */
class AdaptiveLighting {
  /** Create an instance for a _Lightbulb_ service.
    * @param {integer} bri - The IID of the _Brightness_ characteristic.
    * @param {integer} ct - The IID of the _Color Temperature_ characteristic.
    */
  constructor (bri, ct) {
    this._bri = bri
    this._ct = ct
    this._active = false
  }

  /** Adaptive lighting active.
    * @type {boolean}
    * @readonly
    */
  get active () { return this._control != null }

  get briIid () {
    if (this._briIid == null) {
      this._briIid = this._bri instanceof CharacteristicDelegate
        ? this._bri._characteristic.iid
        : this._bri
    }
    return this._briIid
  }

  get ctIid () {
    if (this._ctIid == null) {
      this._ctIid = this._ct instanceof CharacteristicDelegate
        ? this._ct._characteristic.iid
        : this._ct
    }
    return this._ctIid
  }

  /** Deactivtate adaptive lighting.
    */
  deactivate () {
    delete this._control
  }

  /** Generate the value for _Supported Transition Configuration_.
    * @return {string} value - Base64-encodeded configuration.
    */
  generateConfiguration () {
    return Buffer.concat([
      tlvFromBuffer(1, Buffer.concat([
        tlvFromUInt(1, this.briIid),
        tlvFromUInt(2, 1)
      ])),
      tlvFromNull(0),
      tlvFromBuffer(1, Buffer.concat([
        tlvFromUInt(1, this.ctIid),
        tlvFromUInt(2, 2)
      ]))
    ]).toString('base64')
  }

  _generateControl () {
    return tlvFromBuffer(1, Buffer.concat([
      tlvFromUInt(1, this.ctIid),
      tlvFromBuffer(2, Buffer.concat([
        tlvFromHexString(1, this._control.transitionParameters['2.1.2.1']),
        tlvFromUInt(2, this._startTime - epoch),
        tlvFromHexString(3, this._control.transitionParameters['2.1.2.3'])
      ])),
      tlvFromUInt(3, Math.max(1, (new Date()).valueOf() - this._startTime))
    ]))
  }

  /** Generate the response value for setting _Transition Control_.
    * @return {string} value - Base-64 encodeded response.
    */
  generateControlResponse () {
    if (this._control == null) {
      return ''
    }
    return tlvFromBuffer(2, this._generateControl()).toString('base64')
  }

  /** Generate the value for _Transition Control_.
    * @return {string} value - Base64-encodeded value.
    */
  generateControl () {
    if (this._control == null) {
      return ''
    }
    return this._generateControl().toString('base64')
  }

  /** Parse a _Supported Transition Configuration_ value.
    * @param {string} value - Base64-encodeded configuration.
    * @return {object} configuration - Configuration as JavaScript object.
    */
  parseConfiguration (value) {
    return parseTlv(null, Buffer.from(value, 'base64'))
  }

  /** Parse a _Transition Control_ value.
    * @param {string} value - Base64-encodeded control.
    * @return {object} control - Control as JavaScript object.
    * @throws {Error} In case control value doesn't match configuration.
    */
  parseControl (value) {
    if (value === '') {
      return ''
    }
    const buf = Buffer.from(value, 'base64')
    if (buf[0] === 2) {
      value = parseTlv(null, buf).control
    } else {
      value = parseTlv('2', buf)
    }
    const control = value.colorTemperature
    if (control.iid != null && control.iid !== this.ctIid) {
      throw new Error('%d: bad ColorTemperature iid', control.iid)
    }
    if (control.curve != null) {
      if (control.curve.adjustmentIid !== this.briIid) {
        throw new Error('%d: bad Brightness iid', control.curve.adjustmentIid)
      }
      this._control = control
      this._startTime = (new Date(control.transitionParameters.startTime)).valueOf()
    }
    return value
  }

  /** Get the colour temperature in mired for given brightness and time offset.
    * @param {integer} bri - Value for _Brightness_, between 0 and 100%.
    * @param {?integer} offset - Offset in milliseconds from start of adaptive
    * lighting.<br>
    * When not present, current time is used to compute the offset.
    * @return {integer} ct - The _Color Temperature_ value in mired.
    */
  getCt (bri, offset) {
    if (this._control == null) {
      return null
    }
    if (offset == null) {
      offset = (new Date()).valueOf() - this._startTime
    }
    offset %= 86400000
    bri = Math.max(this._control.curve.adjustmentRange.min, bri)
    bri = Math.min(bri, this._control.curve.adjustmentRange.max)
    for (let i = 1; i < this._control.curve.entries.length; i++) {
      const entry = this._control.curve.entries[i]
      const targetCt = Math.round(entry.mired + entry.adjustmentFactor * bri)
      if (offset < entry.offset) {
        const pEntry = this._control.curve.entries[i - 1]
        const ratio = offset / entry.offset
        const mired = (1 - ratio) * pEntry.mired + ratio * entry.mired
        const adjustmentFactor = (1 - ratio) * pEntry.adjustmentFactor +
                                 ratio * entry.adjustmentFactor
        return Math.round(mired + adjustmentFactor * bri)
        // return {
        //   ct: Math.round(mired + adjustmentFactor * bri),
        //   targetCt: targetCt,
        //   interval: entry.offset - offset
        // }
      }
      offset -= entry.offset
      if (entry.duration != null) {
        if (offset < entry.duration) {
          return targetCt
          // return {
          //   ct: targetCt,
          //   targetCt: targetCt,
          //   interval: entry.duration - offset
          // }
        }
        offset -= entry.duration
      }
    }
  }
}

export { AdaptiveLighting }
