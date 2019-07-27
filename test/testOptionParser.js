// homebridge-lib/test/testOptionParser.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2019 Erik Baauw. All rights reserved.

/* global describe, it */

const homebridgeLib = require('../index')
const assert = require('assert')
const util = require('util')

const OptionParser = homebridgeLib.OptionParser
const UserInputError = OptionParser.UserInputError

// ===== TEST SETUP ============================================================

/** Test parameters.
  * @typedef
  * @property {*} v - The value to test.
  * @property {?*} p1 - The options to test.
  * @property {?*} p2 - The options to test.
  * @property {?*} p3 - The options to test.
  * @property {?*} r - The test result should be strictEqual to `r`.
  * @property {?*} s - The test result should be deepStrictEqual to `s`.
  * @property {?Error} e - The should throw e.
  */
let TestParams /* eslint-disable-line */

/** Format a test value.
  * @param {*} value - The test value.
  * @Returns {string} - A representation of the test value.
  */
function fmt (value) {
  let format = '%j'
  if (Array.isArray(value)) {
    format = '[%s]'
  } else if (typeof value === 'function') {
    if (value.prototype != null) {
      format = 'class %s'
    } else if (value.constructor.name === 'AsyncFunction') {
      format = 'async %s'
    } else {
      format = 'function %s'
    }
    value = value.name
  } else if (typeof value === 'object' && value != null) {
    if (typeof value.constructor === 'function' &&
      !['Object', 'Array'].includes(value.constructor.name)
    ) {
      format = 'instance %s'
      value = value.constructor.name
    }
  }
  return util.format(format, value)
}

/** Format a message for a test.
  * @params {!TestParams} t - The test parameters.
  * @param {!integer} n - Number of paramters to `f`.
  * @params {!string} msg - The printf-style message.
  * @params {...string} args - Arguments to the printf-style message.
  */
function format (t, n, msg, ...args) {
  let vmsg = fmt(t.v)
  vmsg = vmsg.length < 12
    ? `${vmsg}${' '.repeat(12)}`.substr(0, 12)
    : `${vmsg}\n${' '.repeat(20)}`
  if (n >= 1) {
    let omsg = fmt(t.p1)
    omsg = omsg.length < 12
      ? `${omsg}${' '.repeat(12)}`.substr(0, 12)
      : `${omsg}\n${' '.repeat(20)}`
    vmsg += omsg
  }
  if (n >= 2) {
    let omsg = fmt(t.p2)
    omsg = omsg.length < 12
      ? `${omsg}${' '.repeat(12)}`.substr(0, 12)
      : `${omsg}\n${' '.repeat(20)}`
    vmsg += omsg
  }
  if (n >= 3) {
    let omsg = fmt(t.p3)
    omsg = omsg.length < 12
      ? `${omsg}${' '.repeat(12)}`.substr(0, 12)
      : `${omsg}\n${' '.repeat(20)}`
    vmsg += omsg
  }
  return util.format(vmsg + msg, ...args)
}

/** Run a test
  * @param {!function} f - The function to test.
  * @param {!integer} n - Number of paramters to `f`.
  * @param {!TestParams[]} tests - The parameters for the tests to run.
  */
function test (f, n, tests) {
  tests.forEach(function (t) {
    if (t.r !== undefined) {
      it(format(t, n, 'should return %s', fmt(t.r)), function () {
        assert.strictEqual(f('key', t.v, t.p1, t.p2, t.p3), t.r)
      })
    } else if (t.s !== undefined) {
      it(format(t, n, 'should return %s', fmt(t.s)), function () {
        assert.deepStrictEqual(f('key', t.v, t.p1, t.p2, t.p3), t.s)
      })
    } else if (t.e != null) {
      it(format(t, n, 'should throw %s \'%s\'', t.e.name, t.e.message), function () {
        assert.throws(function () { f('key', t.v, t.p1, t.p2, t.p3) }, t.e)
      })
    }
  })
}

// Standard test values.
const bool = true
const boolString = '' + bool
const int = 42
const intString = '' + int
const num = 42.1
const numString = '' + num
const str = 'supercalifragilisticexpialidocious'
const array = [1, 2]
const object = { a: 1, b: 2 }
const f = () => {}
const g = async () => {}
class A {}
const a = new A()
class B extends A {}
class C extends B {}
const b = new B()
const c = new C()

// ===== RUN TESTS =============================================================

describe('OptionParser', function () {
  describe('.toBool()', function () {
    // toBool(key, value, userInput)
    test(OptionParser.toBool, 1, [
      // Standard values.
      { e: new TypeError('key: missing boolean value') },
      { p1: true, e: new UserInputError('key: missing boolean value') },
      { v: null, e: new TypeError('key: missing boolean value') },
      { v: null, p1: true, e: new UserInputError('key: missing boolean value') },
      { v: bool, r: true },
      { v: int, e: TypeError('key: not a boolean') },
      { v: int, p1: true, e: new UserInputError('key: not a boolean') },
      { v: num, e: TypeError('key: not a boolean') },
      { v: num, p1: true, e: new UserInputError('key: not a boolean') },
      { v: str, e: TypeError('key: not a boolean') },
      { v: str, p1: true, e: new UserInputError('key: not a boolean') },
      { v: '', e: TypeError('key: not a boolean') },
      { v: '', p1: true, e: new UserInputError('key: not a boolean') },
      { v: boolString, r: true },
      { v: intString, e: TypeError('key: not a boolean') },
      { v: intString, p1: true, e: new UserInputError('key: not a boolean') },
      { v: numString, e: TypeError('key: not a boolean') },
      { v: numString, p1: true, e: new UserInputError('key: not a boolean') },
      { v: array, e: TypeError('key: not a boolean') },
      { v: array, p1: true, e: new UserInputError('key: not a boolean') },
      { v: object, e: TypeError('key: not a boolean') },
      { v: object, p1: true, e: new UserInputError('key: not a boolean') },
      { v: f, e: TypeError('key: not a boolean') },
      { v: f, p1: true, e: new UserInputError('key: not a boolean') },
      { v: g, e: TypeError('key: not a boolean') },
      { v: g, p1: true, e: new UserInputError('key: not a boolean') },
      { v: a, e: TypeError('key: not a boolean') },
      { v: a, p1: true, e: new UserInputError('key: not a boolean') },
      { v: A, e: TypeError('key: not a boolean') },
      { v: A, p1: true, e: new UserInputError('key: not a boolean') },

      // Specific values.
      { v: false, r: false },
      { v: 0, r: false },
      { v: '0', r: false },
      { v: 'false', r: false },
      { v: 'no', r: false },
      { v: 'off', r: false },
      { v: true, r: true },
      { v: 1, r: true },
      { v: '1', r: true },
      { v: 'true', r: true },
      { v: 'yes', r: true },
      { v: 'on', r: true },

      // Parameter checking.
      { v: bool, p1: null, e: new TypeError('userInput: missing boolean value') },
      { v: bool, p1: '', e: new TypeError('userInput: not a boolean') }
    ])
  })
  describe('.toInt()', function () {
    // toInt(key, value, min, max, userInput)
    test(OptionParser.toInt, 3, [
      // Standard values.
      { e: new TypeError('key: missing integer value') },
      { p3: true, e: new UserInputError('key: missing integer value') },
      { v: null, e: new TypeError('key: missing integer value') },
      { v: null, p3: true, e: new UserInputError('key: missing integer value') },
      { v: bool, r: 1 },
      { v: bool, p3: true, r: 1 },
      { v: int, r: int },
      { v: int, p3: true, r: int },
      { v: num, e: TypeError('key: not an integer') },
      { v: num, p3: true, e: new UserInputError('key: not an integer') },
      { v: str, e: TypeError('key: not an integer') },
      { v: str, p3: true, e: new UserInputError('key: not an integer') },
      { v: '', e: TypeError('key: not an integer') },
      { v: '', p3: true, e: new UserInputError('key: not an integer') },
      { v: boolString, e: TypeError('key: not an integer') },
      { v: boolString, p3: true, e: new UserInputError('key: not an integer') },
      { v: intString, r: int },
      { v: intString, p3: true, r: int },
      { v: numString, e: TypeError('key: not an integer') },
      { v: numString, p3: true, e: new UserInputError('key: not an integer') },
      { v: array, e: TypeError('key: not an integer') },
      { v: array, p3: true, e: new UserInputError('key: not an integer') },
      { v: object, e: TypeError('key: not an integer') },
      { v: object, p3: true, e: new UserInputError('key: not an integer') },
      { v: f, e: TypeError('key: not an integer') },
      { v: f, p3: true, e: new UserInputError('key: not an integer') },
      { v: g, e: TypeError('key: not an integer') },
      { v: g, p3: true, e: new UserInputError('key: not an integer') },
      { v: a, e: TypeError('key: not an integer') },
      { v: a, p3: true, e: new UserInputError('key: not an integer') },
      { v: A, e: TypeError('key: not an integer') },
      { v: A, p3: true, e: new UserInputError('key: not an integer') },

      // Specific values.
      { v: false, r: 0 },
      { v: -0, r: 0 },
      { v: 0, r: 0 },
      { v: -42.0, r: -42 },
      { v: 42.0, r: 42 },
      { v: ' -42 ', r: -42 },
      { v: ' 42 ', r: 42 },
      { v: ' -42x', e: TypeError('key: not an integer') },
      { v: ' 42x', e: TypeError('key: not an integer') },
      { v: ' -42.0 ', r: -42 },
      { v: ' 42.0 ', r: 42 },
      { v: ' -0b00101010 ', r: -42 },
      { v: ' 0b00101010 ', r: 42 },
      { v: ' -0o52 ', r: -42 },
      { v: ' 0o52 ', r: 42 },
      { v: ' -0x2a ', r: -42 },
      { v: ' 0x2a ', r: 42 },
      { v: ' -0x2A ', r: -42 },
      { v: ' 0x2A ', r: 42 },

      // p1: min, p2: max
      { v: int, p1: 0, r: int },
      { v: int, p2: 100, r: int },
      { v: int, p1: 0, p2: 100, r: int },
      { v: int, p1: 50, r: 50 },
      { v: int, p2: 100, r: int },
      { v: int, p1: 50, p2: 100, r: 50 },
      { v: int, p1: 0, r: int },
      { v: int, p2: 40, r: 40 },
      { v: int, p1: 0, p2: 40, r: 40 },

      // Parameter checking.
      { v: int, p1: null, e: new TypeError('min: missing integer value') },
      { v: int, p1: null, p3: true, e: new TypeError('min: missing integer value') },
      { v: int, p1: '', e: new TypeError('min: not an integer') },
      { v: int, p1: '', p3: true, e: new TypeError('min: not an integer') },
      { v: int, p2: null, e: new TypeError('max: missing integer value') },
      { v: int, p2: null, p3: true, e: new TypeError('max: missing integer value') },
      { v: int, p2: '', e: new TypeError('max: not an integer') },
      { v: int, p2: '', p3: true, e: new TypeError('max: not an integer') },
      { v: int, p1: 1, p2: 0, e: new RangeError('max: smaller than min') },
      { v: int, p1: 1, p2: 0, p3: true, e: new RangeError('max: smaller than min') },
      { v: bool, p3: null, e: new TypeError('userInput: missing boolean value') },
      { v: bool, p3: '', e: new TypeError('userInput: not a boolean') }
    ])
  })
  describe('.toNumber()', function () {
    // toNumber(key, value, min, max, userInput)
    test(OptionParser.toNumber, 3, [
      // Standard values.
      { e: new TypeError('key: missing number value') },
      { p3: true, e: new UserInputError('key: missing number value') },
      { v: null, e: new TypeError('key: missing number value') },
      { v: null, p3: true, e: new UserInputError('key: missing number value') },
      { v: bool, r: 1 },
      { v: bool, p3: true, r: 1 },
      { v: int, r: int },
      { v: int, p3: true, r: int },
      { v: num, r: num },
      { v: str, e: TypeError('key: not a number') },
      { v: str, p3: true, e: new UserInputError('key: not a number') },
      { v: '', e: TypeError('key: not a number') },
      { v: '', p3: true, e: new UserInputError('key: not a number') },
      { v: boolString, e: TypeError('key: not a number') },
      { v: boolString, p3: true, e: new UserInputError('key: not a number') },
      { v: intString, r: int },
      { v: numString, r: num },
      { v: array, e: TypeError('key: not a number') },
      { v: array, p3: true, e: new UserInputError('key: not a number') },
      { v: object, e: TypeError('key: not a number') },
      { v: object, p3: true, e: new UserInputError('key: not a number') },
      { v: f, e: TypeError('key: not a number') },
      { v: f, p3: true, e: new UserInputError('key: not a number') },
      { v: g, e: TypeError('key: not a number') },
      { v: g, p3: true, e: new UserInputError('key: not a number') },
      { v: a, e: TypeError('key: not a number') },
      { v: a, p3: true, e: new UserInputError('key: not a number') },
      { v: A, e: TypeError('key: not a number') },
      { v: A, p3: true, e: new UserInputError('key: not a number') },

      // specific values
      { v: false, r: 0 },
      { v: -0, r: 0 },
      { v: 0, r: 0 },
      { v: -42.0, r: -42 },
      { v: 42.0, r: 42 },
      { v: -42.1, r: -42.1 },
      { v: 42.1, r: 42.1 },
      { v: ' -42 ', r: -42 },
      { v: ' 42 ', r: 42 },
      { v: ' -42. ', r: -42 },
      { v: ' 42. ', r: 42 },
      { v: ' -42.1 ', r: -42.1 },
      { v: ' 42.1 ', r: 42.1 },
      { v: ' -.1 ', r: -0.1 },
      { v: ' .1 ', r: 0.1 },
      { v: '-0b00101010', e: TypeError('key: not a number') },
      { v: '0b00101010', e: TypeError('key: not a number') },
      { v: '-0o52', e: TypeError('key: not a number') },
      { v: '0o52', e: TypeError('key: not a number') },
      { v: '-0x2a', e: TypeError('key: not a number') },
      { v: '0x2a', e: TypeError('key: not a number') },
      { v: '-0x2A', e: TypeError('key: not a number') },
      { v: '0x2A', e: TypeError('key: not a number') },

      // p1: min, p2: max
      { v: int, p1: 0, r: int },
      { v: int, p2: 100, r: int },
      { v: int, p1: 0, p2: 100, r: int },
      { v: int, p1: 50, r: 50 },
      { v: int, p2: 100, r: int },
      { v: int, p1: 50, p2: 100, r: 50 },
      { v: int, p1: 0, r: int },
      { v: int, p2: 40, r: 40 },
      { v: int, p1: 0, p2: 40, r: 40 },

      // Parameter checking.
      { v: int, p1: null, e: new TypeError('min: missing number value') },
      { v: int, p1: null, p3: true, e: new TypeError('min: missing number value') },
      { v: int, p1: '', e: new TypeError('min: not a number') },
      { v: int, p1: '', p3: true, e: new TypeError('min: not a number') },
      { v: int, p2: null, e: new TypeError('max: missing number value') },
      { v: int, p2: null, p3: true, e: new TypeError('max: missing number value') },
      { v: int, p2: '', e: new TypeError('max: not a number') },
      { v: int, p2: '', p3: true, e: new TypeError('max: not a number') },
      { v: int, p1: 1, p2: 0, e: new RangeError('max: smaller than min') },
      { v: int, p1: 1, p2: 0, p3: true, e: new RangeError('max: smaller than min') },
      { v: bool, p3: null, e: new TypeError('userInput: missing boolean value') },
      { v: bool, p3: '', e: new TypeError('userInput: not a boolean') }
    ])
  })
  describe('.toString()', function () {
    // toString(key, value, nonEmpty, userInput)
    test(OptionParser.toString, 2, [
      // Standard values.
      { r: '' },
      { v: null, r: '' },
      { v: bool, r: boolString },
      { v: int, r: intString },
      { v: num, r: numString },
      { v: str, r: str },
      { v: '', r: '' },
      { v: array, e: TypeError('key: not a string') },
      { v: array, p2: true, e: new UserInputError('key: not a string') },
      { v: object, e: TypeError('key: not a string') },
      { v: object, p2: true, e: new UserInputError('key: not a string') },
      { v: f, e: TypeError('key: not a string') },
      { v: f, p2: true, e: new UserInputError('key: not a string') },
      { v: g, e: TypeError('key: not a string') },
      { v: g, p2: true, e: new UserInputError('key: not a string') },
      { v: a, e: TypeError('key: not a string') },
      { v: a, p2: true, e: new UserInputError('key: not a string') },
      { v: A, e: TypeError('key: not a string') },
      { v: A, p2: true, e: new UserInputError('key: not a string') },

      // p1: nonEmpty
      { p1: true, e: new TypeError('key: missing string value') },
      { p1: true, p2: true, e: new UserInputError('key: missing string value') },
      { v: null, p1: true, e: new TypeError('key: missing string value') },
      { v: null, p1: true, p2: true, e: new UserInputError('key: missing string value') },
      { v: '', p1: true, e: new RangeError('key: not a non-empty string') },
      { v: '', p1: true, p2: true, e: new UserInputError('key: not a non-empty string') },

      // Parameter checking.
      { v: bool, p1: null, e: new TypeError('nonEmpty: missing boolean value') },
      { v: bool, p1: '', e: new TypeError('nonEmpty: not a boolean') },
      { v: bool, p2: null, e: new TypeError('userInput: missing boolean value') },
      { v: bool, p2: '', e: new TypeError('userInput: not a boolean') }
    ])
  })
  describe('.toArray()', function () {
    // toString(key, value, userInput)
    test(OptionParser.toArray, 1, [
      // Standard values.
      { s: [] },
      { v: null, s: [] },
      { v: bool, s: [bool] },
      { v: int, s: [int] },
      { v: num, s: [num] },
      { v: str, s: [str] },
      { v: '', s: [''] },
      { v: array, s: array },
      { v: object, e: new TypeError('key: not an array') },
      { v: object, p1: true, e: new UserInputError('key: not an array') },
      { v: f, e: new TypeError('key: not an array') },
      { v: f, p1: true, e: new UserInputError('key: not an array') },
      { v: g, e: new TypeError('key: not an array') },
      { v: g, p1: true, e: new UserInputError('key: not an array') },
      { v: a, e: new TypeError('key: not an array') },
      { v: a, p1: true, e: new UserInputError('key: not an array') },
      { v: A, e: new TypeError('key: not an array') },
      { v: A, p1: true, e: new UserInputError('key: not an array') },

      // Parameter checking.
      { v: bool, p1: null, e: new TypeError('userInput: missing boolean value') },
      { v: bool, p1: '', e: new TypeError('userInput: not a boolean') }
    ])
  })
  describe('.toObject()', function () {
    // toString(key, value, userInput)
    test(OptionParser.toObject, 1, [
      // Standard values.
      { s: {} },
      { v: null, s: {} },
      { v: bool, e: new TypeError('key: not an object') },
      { v: bool, p1: true, e: new UserInputError('key: not an object') },
      { v: int, e: new TypeError('key: not an object') },
      { v: int, p1: true, e: new UserInputError('key: not an object') },
      { v: num, e: new TypeError('key: not an object') },
      { v: num, p1: true, e: new UserInputError('key: not an object') },
      { v: str, e: new TypeError('key: not an object') },
      { v: str, p1: true, e: new UserInputError('key: not an object') },
      { v: '', e: new TypeError('key: not an object') },
      { v: '', p1: true, e: new UserInputError('key: not an object') },
      { v: array, e: new TypeError('key: not an object') },
      { v: array, p1: true, e: new UserInputError('key: not an object') },
      { v: object, s: object },
      { v: f, e: new TypeError('key: not an object') },
      { v: f, p1: true, e: new UserInputError('key: not an object') },
      { v: g, e: new TypeError('key: not an object') },
      { v: g, p1: true, e: new UserInputError('key: not an object') },
      { v: a, e: new TypeError('key: not an object') },
      { v: a, p1: true, e: new UserInputError('key: not an object') },
      { v: A, e: new TypeError('key: not an object') },
      { v: A, p1: true, e: new UserInputError('key: not an object') },

      // Parameter checking.
      { v: bool, p1: null, e: new TypeError('userInput: missing boolean value') },
      { v: bool, p1: '', e: new TypeError('userInput: not a boolean') }
    ])
  })
  describe('.toFunction()', function () {
    // toString(key, value)
    test(OptionParser.toFunction, 0, [
      // Standard values.
      { e: new TypeError('key: missing function value') },
      { v: null, e: new TypeError('key: missing function value') },
      { v: bool, e: new TypeError('key: not a function') },
      { v: int, e: new TypeError('key: not a function') },
      { v: num, e: new TypeError('key: not a function') },
      { v: str, e: new TypeError('key: not a function') },
      { v: '', e: new TypeError('key: not a function') },
      { v: array, e: new TypeError('key: not a function') },
      { v: object, e: new TypeError('key: not a function') },
      { v: f, s: f },
      { v: g, e: new TypeError('key: not a function') },
      { v: a, e: new TypeError('key: not a function') },
      { v: A, e: new TypeError('key: not a function') }
    ])
  })
  describe('.toClass()', function () {
    // toString(key, value, SuperClass)
    test(OptionParser.toClass, 1, [
      // Standard values.
      { e: new TypeError('key: missing class value') },
      { v: null, e: new TypeError('key: missing class value') },
      { v: bool, e: new TypeError('key: not a class') },
      { v: int, e: new TypeError('key: not a class') },
      { v: num, e: new TypeError('key: not a class') },
      { v: str, e: new TypeError('key: not a class') },
      { v: '', e: new TypeError('key: not a class') },
      { v: array, e: new TypeError('key: not a class') },
      { v: object, e: new TypeError('key: not a class') },
      { v: f, e: new TypeError('key: not a class') },
      { v: g, e: new TypeError('key: not a class') },
      { v: a, e: new TypeError('key: not a class') },
      { v: A, s: A },

      // Specific values.
      { v: A, p1: A, s: A },
      { v: A, p1: B, e: new TypeError('key: not a subclass of B') },
      { v: A, p1: C, e: new TypeError('key: not a subclass of C') },
      { v: B, p1: A, s: B },
      { v: B, p1: B, s: B },
      { v: A, p1: C, e: new TypeError('key: not a subclass of C') },
      { v: C, p1: A, s: C },
      { v: C, p1: B, s: C },
      { v: C, p1: C, s: C },

      // Parameter checking.
      { v: A, p1: null, e: new TypeError('SuperClass: missing class value') },
      { v: A, p1: '', e: new TypeError('SuperClass: not a class') }
    ])
  })
  describe('.toInstance()', function () {
    // toString(key, value, Class)
    test(OptionParser.toInstance, 1, [
      // Standard values.
      { p1: A, e: new TypeError('key: missing instance of A value') },
      { v: null, p1: A, e: new TypeError('key: missing instance of A value') },
      { v: bool, p1: A, e: new TypeError('key: not an instance of A') },
      { v: int, p1: A, e: new TypeError('key: not an instance of A') },
      { v: num, p1: A, e: new TypeError('key: not an instance of A') },
      { v: str, p1: A, e: new TypeError('key: not an instance of A') },
      { v: '', p1: A, e: new TypeError('key: not an instance of A') },
      { v: array, p1: A, e: new TypeError('key: not an instance of A') },
      { v: object, p1: A, e: new TypeError('key: not an instance of A') },
      { v: f, p1: A, e: new TypeError('key: not an instance of A') },
      { v: g, p1: A, e: new TypeError('key: not an instance of A') },
      { v: a, p1: A, a: a },
      { v: A, p1: A, e: new TypeError('key: not an instance of A') },

      // Specific values.
      { v: a, p1: A, s: a },
      { v: a, p1: B, e: new TypeError('key: not an instance of B') },
      { v: a, p1: C, e: new TypeError('key: not an instance of C') },
      { v: b, p1: A, s: b },
      { v: b, p1: B, s: b },
      { v: b, p1: C, e: new TypeError('key: not an instance of C') },
      { v: c, p1: A, s: c },
      { v: c, p1: B, s: c },
      { v: c, p1: C, s: c },

      // Parameter checking.
      { v: A, p1: null, e: new TypeError('Class: missing class value') },
      { v: A, p1: '', e: new TypeError('Class: not a class') }
    ])
  })
  describe('.toIntString()', function () {
    // toIntString(value, radix, length)
    test(OptionParser.toIntString, 2, [
      { v: 255, r: '255' },
      { v: 255, p2: 4, r: ' 255' },
      { v: 255, p2: 8, r: '     255' },
      { v: -255, r: '-255' },
      { v: -255, p2: 4, r: '-255' },
      { v: -255, p2: 8, r: '    -255' },
      { v: 255, p1: 16, r: 'FF' },
      { v: 255, p1: 16, p2: 4, r: '00FF' },
      { v: 255, p1: 16, p2: 8, r: '000000FF' },
      { v: 65535, p1: 16, r: 'FFFF' },
      { v: 65535, p1: 16, p2: 4, r: 'FFFF' },
      { v: 65535, p1: 16, p2: 8, r: '0000FFFF' },
      { v: -255, p1: 16, e: new RangeError('key: not an unsigned integer') }
    ])
  })
  describe('.toNumberString()', function () {
    // toNumberString(value, length, decimals)
    test(OptionParser.toNumberString, 3, [
      { v: Math.PI, r: '' + Math.PI },
      { v: Math.PI, p1: 8, p2: 2, r: '    3.14' },
      { v: Math.PI, p1: 8, p2: 4, r: '  3.1416' },
      { v: Math.PI, p1: 8, p2: 6, r: '3.141593' },
      { v: -Math.PI, r: '' + -Math.PI },
      { v: -Math.PI, p1: 8, p2: 2, r: '   -3.14' },
      { v: -Math.PI, p1: 8, p2: 4, r: ' -3.1416' },
      { v: -Math.PI, p1: 8, p2: 6, r: '-3.141593' }
    ])
  })
})
