// homebridge-lib/lib/CustomeHomeKitTypes.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2025 Erik Baauw. All rights reserved.

const regExps = {
  uuid: /^[0-9A-F]{8}-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/,
  uuidPrefix: /^[0-9A-F]{1,8}$/,
  uuidSuffix: /^-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/
}

let hap
let hapCharacteristics
let hapServices

/** Abstract superclass for {@link EveHomeKitTypes}
  * and {@link MyHomeKitTypes}.
  * <br>See {@link CustomHomeKitTypes}.
  * @name CustomHomeKitTypes
  * @type {Class}
  * @memberof module:homebridge-lib
  */

/** Abstract superclass for {@link EveHomeKitTypes} and {@link MyHomeKitTypes}.
  *
  * `CustomHomeKitTypes` creates and manages a collection of:
  * - Subclasses of {@link Service}, for custom HomeKit service types; and
  * - Subclasses of {@link Characteristic}, for custom HomeKit characteristic
  * types.
  *
  * Plugins access these subclasses through
  * {@link CustomHomeKitTypes#Services} and
  * {@link CustomHomeKitTypes#Characteristics}.
  *
  * Plugins can create these subclasses through
  * {@link CustomHomeKitTypes#createServiceClass} and
  * {@link CustomHomeKitTypes#createCharacteristicClass}
  * @abstract
  */
class CustomHomeKitTypes {
  /** Creates a new instance of `CustomHomeKitTypes`.
    * @param {!API} homebridge - Homebridge API.
    */
  constructor (homebridge) {
    hap = homebridge.hap
    this._Services = {}
    this._Characteristics = {}
  }

  /** Valid HomeKit admin-only access.
    * @type {Object<string, Characteristic.Access>}
    * @readonly
    */
  get Access () { return Object.freeze(Object.assign({}, hap.Access)) }

  /** Valid HomeKit characteristic formats.
    * @type {Object<string, Format>}
    * @readonly
    */
  get Formats () { return Object.freeze(Object.assign({}, hap.Formats)) }

  /** Valid HomeKit characteristic permissions.
    * @type {Object<string, Perm>}
    * @readonly
    */
  get Perms () { return Object.freeze(Object.assign({}, hap.Perms)) }

  /** Standard HomeKit characteristic units.
    * @type {Object<string, Unit>}
    * @readonly
    */
  get Units () { return Object.freeze(Object.assign({}, hap.Units)) }

  /** {@link Characteristic} subclasses for custom HomeKit characteristics.
    * @abstract
    * @type {Object.<string, Class>}
    * @readonly
    */
  get Characteristics () { return this._Characteristics }

  /** {@link Service} subclasses for custom HomeKit services.
    * @abstract
    * @type {Object.<string, Class>}
    * @readonly
    */
  get Services () { return this._Services }

  /** @link Characteristic} subclasses for standard HomeKit characteristics.
    * @type {Object<string, Class>}
    * @readonly
    */
  get hapCharacteristics () {
    if (hapCharacteristics == null) {
      hapCharacteristics = {}
      Object.keys(hap.Characteristic).sort().filter((key) => {
        return regExps.uuid.test(hap.Characteristic[key].UUID)
      }).forEach((key) => {
        hapCharacteristics[key] = hap.Characteristic[key]
      })
      Object.freeze(hapCharacteristics)
    }
    return hapCharacteristics
  }

  /** {@link Service} subclasses for custom HomeKit services.
    * @type {Object<string, Class>}
    * @readonly
    */
  get hapServices () {
    if (hapServices == null) {
      hapServices = {}
      Object.keys(hap.Service).sort().filter((key) => {
        return regExps.uuid.test(hap.Service[key].UUID)
      }).forEach((key) => {
        hapServices[key] = hap.Service[key]
      })
      Object.freeze(hapServices)
    }
    return hapServices
  }

  /** Creates a new subclass of {@link Characteristic}
    * for a custom HomeKit characteristic.
    *
    * The newly created subclass is stored under `key` in
    * {@link CustomHomeKitTypes#Characteristics}.
    *
    * @final
    * @param {!string} key - Key for the Characteristic subclass.
    * @param {!string} uuid - Custom characteristic UUID.
    * @param {Props} props - Custom characteristic properties.
    * @param {string} [displayName=key] - Name displayed in HomeKit.
    * @returns {Class} The new {@link Characteristic} subclass.
    * @throws {TypeError} When a parameter has an invalid type.
    * @throws {RangeError} When a parameter has an invalid value.
    * @throws {SyntaxError} On duplicate key.
   */
  createCharacteristicClass (key, uuid, props, displayName = key) {
    if (typeof key !== 'string') {
      throw new TypeError('key: not a string')
    }
    if (key === '') {
      throw new RangeError('key: invalid empty string')
    }
    if (this._Characteristics[key] != null) {
      throw new SyntaxError(`${key}: duplicate key`)
    }
    if (!regExps.uuid.test(uuid)) {
      throw new RangeError(`uuid: ${uuid}: invalid UUID`)
    }

    this._Characteristics[key] = class extends hap.Characteristic {
      constructor () {
        super(displayName, uuid)
        this.setProps(props)
        this.value = this.getDefaultValue()
      }
    }
    this._Characteristics[key].UUID = uuid
    return this._Characteristics[key]
  }

  /** Creates a new subclass of {@link Service}
    * for a custom HomeKit service.
    *
    * The newly created subclass is stored under
    * {@link CustomHomeKitTypes#Services}.
    *
    * @final
    * @param {!string} key - Key for the Service.
    * @param {!string} uuid - UUID for the Service.
    * @param {Class[]} Characteristics - {@link Characteristic}
    * subclasses for pre-defined characteristics.
    * @param {Class[]} [OptionalCharacteristics=[]] -
    * {@link Characteristic} subclasses for optional characteristics.
    * @returns {Class} The new {@link Service} subclass.
    * @throws {TypeError} When a parameter has an invalid type.
    * @throws {RangeError} When a parameter has an invalid value.
    * @throws {SyntaxError} On duplicate key.
    */
  createServiceClass (key, uuid, Characteristics, OptionalCharacteristics = []) {
    if (typeof key !== 'string') {
      throw new TypeError('key: not a string')
    }
    if (key === '') {
      throw new RangeError('key: invalid empty string')
    }
    if (this._Services[key] != null) {
      throw new SyntaxError(`${key}: duplicate key`)
    }
    if (!regExps.uuid.test(uuid)) {
      throw new RangeError(`uuid: ${uuid}: invalid UUID`)
    }

    this._Services[key] = class extends hap.Service {
      constructor (displayName, subtype) {
        super(displayName, uuid, subtype)
        for (const Characteristic of Characteristics) {
          this.addCharacteristic(Characteristic)
        }
        for (const Characteristic of OptionalCharacteristics) {
          this.addOptionalCharacteristic(Characteristic)
        }
      }
    }
    this._Services[key].UUID = uuid
    return this._Services[key]
  }

  /** Return the full HAP UUID.
    * @final
    * @param {!string} id - The short HAP UUID.
    * @param {?string} [suffix='-0000-1000-8000-0026BB765291'] - The suffix for
    * the long UUID.<br>
    * The default value is used by the standard HomeKit services and
    * characteristics, as defined by Apple.
    * @returns {!string} The full HAP UUID.
    * @throws {TypeError} When a parameter has an invalid type.
    * @throws {RangeError} When a parameter has an invalid value.
    */
  static uuid (id, suffix = '-0000-1000-8000-0026BB765291') {
    if (typeof id !== 'string') {
      throw new TypeError('id: not a string')
    }
    if (!regExps.uuidPrefix.test(id)) {
      throw new RangeError(`id: ${id}: invalid id`)
    }
    if (typeof suffix !== 'string') {
      throw new TypeError('suffix: not a string')
    }
    if (!regExps.uuidSuffix.test(suffix)) {
      throw new RangeError(`suffix: ${suffix}: invalid suffix`)
    }
    return ('00000000' + id).slice(-8) + suffix
  }
}

export { CustomHomeKitTypes }
