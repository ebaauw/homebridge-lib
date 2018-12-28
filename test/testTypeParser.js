// homebridge-lib/test/testTypeParser.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2019 Erik Baauw. All rights reserved.

/* global describe, it */

const homebridgeLib = require('../index')
const assert = require('assert')
const util = require('util')

const TypeParser = homebridgeLib.TypeParser
const UserInputError = TypeParser.UserInputError

// @typedef test
// @property {*} [v] - The value to test.
// @property {object} [o] - The options to test.
// @property {*} [r] - The expected test result.
// @property {Error} e - The expected test error.

function fmt (value) {
  let format
  if (Array.isArray(value)) {
    format = '[%s]'
  } else if (typeof value === 'function') {
    if (value.toString().substring(0, 9) === 'function ') {
      format = '%s()'
    } else {
      format = 'class %s'
    }
    value = value.name
  } else if (typeof value === 'object' && value != null) {
    if (typeof value.constructor === 'function' &&
      !['Object', 'Array', 'Function'].includes(value.constructor.name)
    ) {
      format = '%s'
      value = value.constructor.name
    } else {
      format = '%o'
      if (value.class != null) {
        value = Object.assign({}, value, { class: 'class ' + value.class.name })
      }
    }
  } else {
    format = '%o'
  }
  return util.format(format, value)
}

// Format a message describing a test
// @params {object} t - Test.
// @params {*} [t.v] - Value to test.
// @params {object} [t.o] - Options to test.
// @params {string} msg - Printf-style message.
// @param {...string} args - Arguments to the printf-style message.
// @retuns {string} Formatted message.
function format (t, msg, ...args) {
  let vmsg = fmt(t.v)
  vmsg = vmsg.length < 12
    ? `${vmsg}${' '.repeat(12)}`.substr(0, 12)
    : `${vmsg}\n${' '.repeat(20)}`
  let omsg = fmt(t.o)
  omsg = omsg.length < 24
    ? `${omsg}${' '.repeat(24)}`.substr(0, 24)
    : `${omsg}\n${' '.repeat(44)}`
  msg = vmsg + omsg + msg
  return util.format(msg, ...args)
}

// Test a toX() function.
// @params {function} f - Function to test.
// @params {Array<test>} tests - Tests to run.
function test (f, tests) {
  tests.forEach(function (t) {
    if (t.r !== undefined) {
      it(format(t, 'should return %s', fmt(t.r)), function () {
        assert.strictEqual(f(t.v, t.o), t.r)
      })
    } else if (t.s !== undefined) {
      it(format(t, 'should return %s', fmt(t.s)), function () {
        assert.deepStrictEqual(f(t.v, t.o), t.s)
      })
    } else if (t.e != null) {
      it(format(t, 'should throw %s \'%s\'', t.e.name, t.e.message), function () {
        assert.throws(function () { f(t.v, t.o) }, t.e)
      })
    }
  })
}

// Test values.
const bool = true
const boolString = '' + bool
const int = 42
const intString = '' + int
const num = 42.1
const numString = '' + num
const str = 'supercalifragilisticexpialidocious'
const array = [1, 2]
const object = { a: 1, b: 2 }
const func = function f (a) { return a }
class SuperClass {}
class SubClass extends SuperClass {}
class OtherClass {}
const instance = new SubClass()

describe('TypeParser', function () {
  describe('.toAny()', function () {
    const typeErrorMissingValue = new TypeError('missing value')
    const userInputErrorMissingValue = new UserInputError('missing value')
    test(TypeParser.toAny, [
      // no options
      { e: typeErrorMissingValue },
      { v: null, e: typeErrorMissingValue },
      { v: bool, r: bool },
      { v: int, r: int },
      { v: num, r: num },
      { v: str, r: str },
      { v: array, r: array },
      { v: object, r: object },
      { v: func, r: func },
      { v: instance, r: instance },
      { v: SubClass, r: SubClass },
      // options.strict: false
      { o: { strict: false }, e: typeErrorMissingValue },
      { v: null, o: { strict: false }, e: typeErrorMissingValue },
      { v: bool, o: { strict: false }, r: bool },
      { v: int, o: { strict: false }, r: int },
      { v: num, o: { strict: false }, r: num },
      { v: str, o: { strict: false }, r: str },
      { v: array, o: { strict: false }, r: array },
      { v: object, o: { strict: false }, r: object },
      { v: func, o: { strict: false }, r: func },
      { v: instance, o: { strict: false }, r: instance },
      { v: SubClass, o: { strict: false }, r: SubClass },
      // options.strict: true
      { o: { strict: true }, e: typeErrorMissingValue },
      { v: null, o: { strict: true }, e: typeErrorMissingValue },
      { v: bool, o: { strict: true }, r: bool },
      { v: int, o: { strict: true }, r: int },
      { v: num, o: { strict: true }, r: num },
      { v: str, o: { strict: true }, r: str },
      { v: array, o: { strict: true }, r: array },
      { v: object, o: { strict: true }, r: object },
      { v: func, o: { strict: true }, r: func },
      { v: instance, o: { strict: true }, r: instance },
      { v: SubClass, o: { strict: true }, r: SubClass },
      // options.defaultValue
      { o: { defaultValue: undefined }, e: new TypeError('options.defaultValue: missing value') },
      { o: { defaultValue: null }, r: null },
      { o: { defaultValue: bool }, r: bool },
      { o: { defaultValue: int }, r: int },
      { o: { defaultValue: num }, r: num },
      { o: { defaultValue: str }, r: str },
      { o: { defaultValue: bool }, r: bool },
      { o: { defaultValue: array }, r: array },
      { o: { defaultValue: object }, r: object },
      { o: { defaultValue: func }, r: func },
      { o: { defaultValue: instance }, r: instance },
      { o: { defaultValue: SubClass }, r: SubClass },
      { v: null, o: { defaultValue: bool }, r: bool },
      { v: null, o: { defaultValue: int }, r: int },
      { v: null, o: { defaultValue: num }, r: num },
      { v: null, o: { defaultValue: str }, r: str },
      { v: null, o: { defaultValue: bool }, r: bool },
      { v: null, o: { defaultValue: array }, r: array },
      { v: null, o: { defaultValue: object }, r: object },
      { v: null, o: { defaultValue: func }, r: func },
      { v: null, o: { defaultValue: instance }, r: instance },
      { v: null, o: { defaultValue: SubClass }, r: SubClass },
      { v: bool, o: { defaultValue: 'not used' }, r: bool },
      { v: int, o: { defaultValue: 'not used' }, r: int },
      { v: num, o: { defaultValue: 'not used' }, r: num },
      { v: str, o: { defaultValue: 'not used' }, r: str },
      { v: array, o: { defaultValue: 'not used' }, r: array },
      { v: object, o: { defaultValue: 'not used' }, r: object },
      { v: func, o: { defaultValue: 'not used' }, r: func },
      { v: instance, o: { defaultValue: 'not used' }, r: instance },
      { v: SubClass, o: { defaultValue: 'not used' }, r: SubClass },
      // options.userInput: false
      { o: { userInput: false }, e: typeErrorMissingValue },
      { v: null, o: { userInput: false }, e: typeErrorMissingValue },
      { v: bool, o: { userInput: false }, r: bool },
      { v: int, o: { userInput: false }, r: int },
      { v: num, o: { userInput: false }, r: num },
      { v: str, o: { userInput: false }, r: str },
      { v: array, o: { userInput: false }, r: array },
      { v: object, o: { userInput: false }, r: object },
      { v: func, o: { userInput: false }, r: func },
      { v: instance, o: { userInput: false }, r: instance },
      { v: SubClass, o: { userInput: false }, r: SubClass },
      // options.userInput: true
      { o: { userInput: true }, e: userInputErrorMissingValue },
      { v: null, o: { userInput: true }, e: userInputErrorMissingValue },
      { v: bool, o: { userInput: true }, r: bool },
      { v: int, o: { userInput: true }, r: int },
      { v: num, o: { userInput: true }, r: num },
      { v: str, o: { userInput: true }, r: str },
      { v: array, o: { userInput: true }, r: array },
      { v: object, o: { userInput: true }, r: object },
      { v: func, o: { userInput: true }, r: func },
      { v: instance, o: { userInput: true }, r: instance },
      { v: SubClass, o: { userInput: true }, r: SubClass },
      // invalid options
      { o: { strict: 'maybe' }, e: new TypeError('options.strict: not a boolean') },
      { o: { userInput: 'maybe' }, e: new TypeError('options.userInput: not a boolean') },
      { o: { mandatory: false }, e: new TypeError('options.mandatory: invalid key') }
    ])
  })
  describe('.toBoolean()', function () {
    const typeErrorMissingValue = new TypeError('missing boolean value')
    const userInputErrorMissingValue = new UserInputError('missing boolean value')
    const typeError = new TypeError('not a boolean')
    const userInputError = new UserInputError('not a boolean')
    test(TypeParser.toBoolean, [
      // no options
      { e: typeErrorMissingValue },
      { v: null, e: typeErrorMissingValue },
      { v: false, r: false },
      { v: true, r: true },
      { v: int, e: typeError },
      { v: 0, r: false },
      { v: 1, r: true },
      { v: num, e: typeError },
      { v: intString, e: typeError },
      { v: '0', r: false },
      { v: '1', r: true },
      { v: numString, e: typeError },
      { v: str, e: typeError },
      { v: 'false', r: false },
      { v: 'no', r: false },
      { v: 'true', r: true },
      { v: 'yes', r: true },
      { v: array, e: typeError },
      { v: object, e: typeError },
      { v: func, e: typeError },
      { v: instance, e: typeError },
      { v: SubClass, e: typeError },
      // options.strict: false
      { o: { strict: false }, e: typeErrorMissingValue },
      { v: null, o: { strict: false }, e: typeErrorMissingValue },
      { v: false, o: { strict: false }, r: false },
      { v: true, o: { strict: false }, r: true },
      { v: int, o: { strict: false }, e: typeError },
      { v: 0, o: { strict: false }, r: false },
      { v: 1, o: { strict: false }, r: true },
      { v: num, o: { strict: false }, e: typeError },
      { v: intString, o: { strict: false }, e: typeError },
      { v: '0', o: { strict: false }, r: false },
      { v: '1', o: { strict: false }, r: true },
      { v: numString, o: { strict: false }, e: typeError },
      { v: str, o: { strict: false }, e: typeError },
      { v: 'false', o: { strict: false }, r: false },
      { v: 'no', o: { strict: false }, r: false },
      { v: 'true', o: { strict: false }, r: true },
      { v: 'yes', o: { strict: false }, r: true },
      { v: array, o: { strict: false }, e: typeError },
      { v: object, o: { strict: false }, e: typeError },
      { v: func, o: { strict: false }, e: typeError },
      { v: instance, o: { strict: false }, e: typeError },
      { v: SubClass, o: { strict: false }, e: typeError },
      // options.strict: true
      { o: { strict: true }, e: typeErrorMissingValue },
      { v: null, o: { strict: true }, e: typeErrorMissingValue },
      { v: false, o: { strict: true }, r: false },
      { v: true, o: { strict: true }, r: true },
      { v: int, o: { strict: true }, e: typeError },
      { v: 0, o: { strict: true }, e: typeError },
      { v: 1, o: { strict: true }, e: typeError },
      { v: num, o: { strict: true }, e: typeError },
      { v: intString, o: { strict: true }, e: typeError },
      { v: '0', o: { strict: true }, e: typeError },
      { v: '1', o: { strict: true }, e: typeError },
      { v: numString, o: { strict: true }, e: typeError },
      { v: str, o: { strict: true }, e: typeError },
      { v: 'false', o: { strict: true }, e: typeError },
      { v: 'no', o: { strict: true }, e: typeError },
      { v: 'true', o: { strict: true }, e: typeError },
      { v: 'yes', o: { strict: true }, e: typeError },
      { v: array, o: { strict: true }, e: typeError },
      { v: object, o: { strict: true }, e: typeError },
      { v: func, o: { strict: true }, e: typeError },
      { v: instance, o: { strict: true }, e: typeError },
      { v: SubClass, o: { strict: true }, e: typeError },
      // options.defaultValue: null
      { o: { defaultValue: null }, r: null },
      { v: null, o: { defaultValue: null }, r: null },
      { v: false, o: { defaultValue: null }, r: false },
      { v: true, o: { defaultValue: null }, r: true },
      { v: int, o: { defaultValue: null }, r: null },
      { v: 0, o: { defaultValue: null }, r: false },
      { v: 1, o: { defaultValue: null }, r: true },
      { v: num, o: { defaultValue: null }, r: null },
      { v: intString, o: { defaultValue: null }, r: null },
      { v: '0', o: { defaultValue: null }, r: false },
      { v: '1', o: { defaultValue: null }, r: true },
      { v: numString, o: { defaultValue: null }, r: null },
      { v: str, o: { defaultValue: null }, r: null },
      { v: 'false', o: { defaultValue: null }, r: false },
      { v: 'no', o: { defaultValue: null }, r: false },
      { v: 'true', o: { defaultValue: null }, r: true },
      { v: 'yes', o: { defaultValue: null }, r: true },
      { v: array, o: { defaultValue: null }, r: null },
      { v: object, o: { defaultValue: null }, r: null },
      { v: func, o: { defaultValue: null }, r: null },
      { v: instance, o: { defaultValue: null }, r: null },
      { v: SubClass, o: { defaultValue: null }, r: null },
      // options.strict: true, options.defaultValue: null
      { o: { strict: true, defaultValue: null }, e: typeErrorMissingValue },
      { v: null, o: { strict: true, defaultValue: null }, r: null },
      { v: false, o: { strict: true, defaultValue: null }, r: false },
      { v: true, o: { strict: true, defaultValue: null }, r: true },
      { v: int, o: { strict: true, defaultValue: null }, e: typeError },
      { v: 0, o: { strict: true, defaultValue: null }, e: typeError },
      { v: 1, o: { strict: true, defaultValue: null }, e: typeError },
      { v: num, o: { strict: true, defaultValue: null }, e: typeError },
      { v: intString, o: { strict: true, defaultValue: null }, e: typeError },
      { v: '0', o: { strict: true, defaultValue: null }, e: typeError },
      { v: '1', o: { strict: true, defaultValue: null }, e: typeError },
      { v: numString, o: { strict: true, defaultValue: null }, e: typeError },
      { v: str, o: { strict: true, defaultValue: null }, e: typeError },
      { v: 'false', o: { strict: true, defaultValue: null }, e: typeError },
      { v: 'no', o: { strict: true, defaultValue: null }, e: typeError },
      { v: 'true', o: { strict: true, defaultValue: null }, e: typeError },
      { v: 'yes', o: { strict: true, defaultValue: null }, e: typeError },
      { v: array, o: { strict: true, defaultValue: null }, e: typeError },
      { v: object, o: { strict: true, defaultValue: null }, e: typeError },
      { v: func, o: { strict: true, defaultValue: null }, e: typeError },
      { v: instance, o: { strict: true, defaultValue: null }, e: typeError },
      { v: SubClass, o: { strict: true, defaultValue: null }, e: typeError },
      // options.userInput: false
      { o: { userInput: false }, e: typeErrorMissingValue },
      { v: null, o: { userInput: false }, e: typeErrorMissingValue },
      { v: false, o: { userInput: false }, r: false },
      { v: true, o: { userInput: false }, r: true },
      { v: int, o: { userInput: false }, e: typeError },
      { v: 0, o: { userInput: false }, r: false },
      { v: 1, o: { userInput: false }, r: true },
      { v: num, o: { userInput: false }, e: typeError },
      { v: intString, o: { userInput: false }, e: typeError },
      { v: '0', o: { userInput: false }, r: false },
      { v: '1', o: { userInput: false }, r: true },
      { v: numString, o: { userInput: false }, e: typeError },
      { v: str, o: { userInput: false }, e: typeError },
      { v: 'false', o: { userInput: false }, r: false },
      { v: 'no', o: { userInput: false }, r: false },
      { v: 'true', o: { userInput: false }, r: true },
      { v: 'yes', o: { userInput: false }, r: true },
      { v: array, o: { userInput: false }, e: typeError },
      { v: object, o: { userInput: false }, e: typeError },
      { v: func, o: { userInput: false }, e: typeError },
      { v: instance, o: { userInput: false }, e: typeError },
      { v: SubClass, o: { userInput: false }, e: typeError },
      // options.userInput: true
      { o: { userInput: true }, e: userInputErrorMissingValue },
      { v: null, o: { userInput: true }, e: userInputErrorMissingValue },
      { v: false, o: { userInput: true }, r: false },
      { v: true, o: { userInput: true }, r: true },
      { v: int, o: { userInput: true }, e: userInputError },
      { v: 0, o: { userInput: true }, r: false },
      { v: 1, o: { userInput: true }, r: true },
      { v: num, o: { userInput: true }, e: userInputError },
      { v: intString, o: { userInput: true }, e: userInputError },
      { v: '0', o: { userInput: true }, r: false },
      { v: '1', o: { userInput: true }, r: true },
      { v: numString, o: { userInput: true }, e: userInputError },
      { v: str, o: { userInput: true }, e: userInputError },
      { v: 'false', o: { userInput: true }, r: false },
      { v: 'no', o: { userInput: true }, r: false },
      { v: 'true', o: { userInput: true }, r: true },
      { v: 'yes', o: { userInput: true }, r: true },
      { v: array, o: { userInput: true }, e: userInputError },
      { v: object, o: { userInput: true }, e: userInputError },
      { v: func, o: { userInput: true }, e: userInputError },
      { v: instance, o: { userInput: true }, e: userInputError },
      { v: SubClass, o: { userInput: true }, e: userInputError },
      // invalid options
      { o: { strict: 'maybe' }, e: new TypeError('options.strict: not a boolean') },
      { o: { defaultValue: undefined }, e: new TypeError('options.defaultValue: missing boolean value') },
      { o: { userInput: 'maybe' }, e: new TypeError('options.userInput: not a boolean') },
      { o: { mandatory: false }, e: new TypeError('options.mandatory: invalid key') }
    ])
  })
  describe('.toInteger()', function () {
    const typeErrorMissingValue = new TypeError('missing integer value')
    const userInputErrorMissingValue = new UserInputError('missing integer value')
    const typeError = new TypeError('not an integer')
    const userInputError = new UserInputError('not an integer')
    const rangeErrorMin = new RangeError('invalid integer value: below 1')
    const rangeErrorMax = new RangeError('invalid integer value: above 0')
    test(TypeParser.toInteger, [
      // no options
      { e: typeErrorMissingValue },
      { v: null, e: typeErrorMissingValue },
      { v: false, r: 0 },
      { v: true, r: 1 },
      { v: -int, r: -int },
      { v: -1, r: -1 },
      { v: -0, r: -0 },
      { v: 0, r: 0 },
      { v: 1, r: 1 },
      { v: int, r: int },
      { v: -Infinity, e: typeError },
      { v: -num, e: typeError },
      { v: -1.1, e: typeError },
      { v: -1.0, r: -1 },
      { v: 1.0, r: 1 },
      { v: 1.1, e: typeError },
      { v: num, e: typeError },
      { v: Infinity, e: typeError },
      { v: NaN, e: typeError },
      { v: '-' + intString, r: -int },
      { v: '-1', r: -1 },
      { v: '-0', r: -0 },
      { v: '0', r: 0 },
      { v: '1', r: 1 },
      { v: intString, r: int },
      { v: ' ' + intString, r: int },
      { v: intString + ' ', r: int },
      { v: '-' + numString, e: typeError },
      { v: '-1.1', e: typeError },
      { v: '-1.0', r: -1 },
      { v: '1.0', r: 1 },
      { v: '1.1', e: typeError },
      { v: numString, e: typeError },
      { v: 'x' + intString, e: typeError },
      { v: intString + 'x', e: typeError },
      { v: str, e: typeError },
      { v: array, e: typeError },
      { v: object, e: typeError },
      { v: func, e: typeError },
      { v: instance, e: typeError },
      { v: SubClass, e: typeError },
      // options.strict: false
      { o: { strict: false }, e: typeErrorMissingValue },
      { v: null, o: { strict: false }, e: typeErrorMissingValue },
      { v: false, o: { strict: false }, r: 0 },
      { v: true, o: { strict: false }, r: 1 },
      { v: -int, o: { strict: false }, r: -int },
      { v: -1, o: { strict: false }, r: -1 },
      { v: -0, o: { strict: false }, r: -0 },
      { v: 0, o: { strict: false }, r: 0 },
      { v: 1, o: { strict: false }, r: 1 },
      { v: int, o: { strict: false }, r: int },
      { v: -Infinity, o: { strict: false }, e: typeError },
      { v: -num, o: { strict: false }, e: typeError },
      { v: -1.1, o: { strict: false }, e: typeError },
      { v: -1.0, o: { strict: false }, r: -1 },
      { v: 1.0, o: { strict: false }, r: 1 },
      { v: 1.1, o: { strict: false }, e: typeError },
      { v: num, o: { strict: false }, e: typeError },
      { v: Infinity, o: { strict: false }, e: typeError },
      { v: NaN, o: { strict: false }, e: typeError },
      { v: '-' + intString, o: { strict: false }, r: -int },
      { v: '-1', o: { strict: false }, r: -1 },
      { v: '-0', o: { strict: false }, r: -0 },
      { v: '0', o: { strict: false }, r: 0 },
      { v: '1', o: { strict: false }, r: 1 },
      { v: intString, o: { strict: false }, r: int },
      { v: ' ' + intString, o: { strict: false }, r: int },
      { v: intString + ' ', o: { strict: false }, r: int },
      { v: '-' + numString, o: { strict: false }, e: typeError },
      { v: '-1.1', o: { strict: false }, e: typeError },
      { v: '-1.0', o: { strict: false }, r: -1 },
      { v: '1.0', o: { strict: false }, r: 1 },
      { v: '1.1', o: { strict: false }, e: typeError },
      { v: numString, o: { strict: false }, e: typeError },
      { v: 'x' + intString, o: { strict: false }, e: typeError },
      { v: intString + 'x', o: { strict: false }, e: typeError },
      { v: str, o: { strict: false }, e: typeError },
      { v: array, o: { strict: false }, e: typeError },
      { v: object, o: { strict: false }, e: typeError },
      { v: func, o: { strict: false }, e: typeError },
      { v: instance, o: { strict: false }, e: typeError },
      { v: SubClass, o: { strict: false }, e: typeError },
      // options.strict: true
      { o: { strict: true }, e: typeErrorMissingValue },
      { v: null, o: { strict: true }, e: typeErrorMissingValue },
      { v: false, o: { strict: true }, e: typeError },
      { v: true, o: { strict: true }, e: typeError },
      { v: -int, o: { strict: true }, r: -int },
      { v: -1, o: { strict: true }, r: -1 },
      { v: -0, o: { strict: true }, r: -0 },
      { v: 0, o: { strict: true }, r: 0 },
      { v: 1, o: { strict: true }, r: 1 },
      { v: int, o: { strict: true }, r: int },
      { v: -Infinity, o: { strict: true }, e: typeError },
      { v: -num, o: { strict: true }, e: typeError },
      { v: -1.1, o: { strict: true }, e: typeError },
      { v: -1.0, o: { strict: true }, r: -1 },
      { v: 1.0, o: { strict: true }, r: 1 },
      { v: 1.1, o: { strict: true }, e: typeError },
      { v: num, o: { strict: true }, e: typeError },
      { v: Infinity, o: { strict: true }, e: typeError },
      { v: NaN, o: { strict: true }, e: typeError },
      { v: '-' + intString, o: { strict: true }, e: typeError },
      { v: '-1', o: { strict: true }, e: typeError },
      { v: '-0', o: { strict: true }, e: typeError },
      { v: '0', o: { strict: true }, e: typeError },
      { v: '1', o: { strict: true }, e: typeError },
      { v: intString, o: { strict: true }, e: typeError },
      { v: ' ' + intString, o: { strict: true }, e: typeError },
      { v: intString + ' ', o: { strict: true }, e: typeError },
      { v: '-' + numString, o: { strict: true }, e: typeError },
      { v: '-1.1', o: { strict: true }, e: typeError },
      { v: '-1.0', o: { strict: true }, e: typeError },
      { v: '1.0', o: { strict: true }, e: typeError },
      { v: '1.1', o: { strict: true }, e: typeError },
      { v: numString, o: { strict: true }, e: typeError },
      { v: 'x' + intString, o: { strict: true }, e: typeError },
      { v: intString + 'x', o: { strict: true }, e: typeError },
      { v: str, o: { strict: true }, e: typeError },
      { v: array, o: { strict: true }, e: typeError },
      { v: object, o: { strict: true }, e: typeError },
      { v: func, o: { strict: true }, e: typeError },
      { v: instance, o: { strict: true }, e: typeError },
      { v: SubClass, o: { strict: true }, e: typeError },
      // options.defaultValue: int
      { o: { defaultValue: null }, r: null },
      { v: null, o: { defaultValue: null }, r: null },
      { v: false, o: { defaultValue: null }, r: 0 },
      { v: true, o: { defaultValue: null }, r: 1 },
      { v: -int, o: { defaultValue: null }, r: -int },
      { v: -1, o: { defaultValue: null }, r: -1 },
      { v: -0, o: { defaultValue: null }, r: -0 },
      { v: 0, o: { defaultValue: null }, r: 0 },
      { v: 1, o: { defaultValue: null }, r: 1 },
      { v: int, o: { defaultValue: null }, r: int },
      { v: -Infinity, o: { defaultValue: null }, r: null },
      { v: -num, o: { defaultValue: null }, r: null },
      { v: -1.1, o: { defaultValue: null }, r: null },
      { v: -1.0, o: { defaultValue: null }, r: -1 },
      { v: 1.0, o: { defaultValue: null }, r: 1 },
      { v: 1.1, o: { defaultValue: null }, r: null },
      { v: num, o: { defaultValue: null }, r: null },
      { v: Infinity, o: { defaultValue: null }, r: null },
      { v: NaN, o: { defaultValue: null }, r: null },
      { v: '-' + intString, o: { defaultValue: null }, r: -int },
      { v: '-1', o: { defaultValue: null }, r: -1 },
      { v: '-0', o: { defaultValue: null }, r: -0 },
      { v: '0', o: { defaultValue: null }, r: 0 },
      { v: '1', o: { defaultValue: null }, r: 1 },
      { v: intString, o: { defaultValue: null }, r: int },
      { v: ' ' + intString, o: { defaultValue: null }, r: int },
      { v: intString + ' ', o: { defaultValue: null }, r: int },
      { v: '-' + numString, o: { defaultValue: null }, r: null },
      { v: '-1.1', o: { defaultValue: null }, r: null },
      { v: '-1.0', o: { defaultValue: null }, r: -1 },
      { v: '1.0', o: { defaultValue: null }, r: 1 },
      { v: '1.1', o: { defaultValue: null }, r: null },
      { v: numString, o: { defaultValue: null }, r: null },
      { v: 'x' + intString, o: { defaultValue: null }, r: null },
      { v: intString + 'x', o: { defaultValue: null }, r: null },
      { v: str, o: { defaultValue: null }, r: null },
      { v: array, o: { defaultValue: null }, r: null },
      { v: object, o: { defaultValue: null }, r: null },
      { v: func, o: { defaultValue: null }, r: null },
      { v: instance, o: { defaultValue: null }, r: null },
      { v: SubClass, o: { defaultValue: null }, r: null },
      // options.strict: true, options.defaultValue: int
      { o: { strict: true, defaultValue: null }, e: typeErrorMissingValue },
      { v: null, o: { strict: true, defaultValue: null }, r: null },
      { v: false, o: { strict: true, defaultValue: null }, e: typeError },
      { v: true, o: { strict: true, defaultValue: null }, e: typeError },
      { v: -int, o: { strict: true, defaultValue: null }, r: -int },
      { v: -1, o: { strict: true, defaultValue: null }, r: -1 },
      { v: -0, o: { strict: true, defaultValue: null }, r: -0 },
      { v: 0, o: { strict: true, defaultValue: null }, r: 0 },
      { v: 1, o: { strict: true, defaultValue: null }, r: 1 },
      { v: int, o: { strict: true, defaultValue: null }, r: int },
      { v: -Infinity, o: { strict: true, defaultValue: null }, e: typeError },
      { v: -num, o: { strict: true, defaultValue: null }, e: typeError },
      { v: -1.1, o: { strict: true, defaultValue: null }, e: typeError },
      { v: -1.0, o: { strict: true, defaultValue: null }, r: -1 },
      { v: 1.0, o: { strict: true, defaultValue: null }, r: 1 },
      { v: 1.1, o: { strict: true, defaultValue: null }, e: typeError },
      { v: num, o: { strict: true, defaultValue: null }, e: typeError },
      { v: Infinity, o: { strict: true, defaultValue: null }, e: typeError },
      { v: NaN, o: { strict: true, defaultValue: null }, e: typeError },
      { v: '-' + intString, o: { strict: true, defaultValue: null }, e: typeError },
      { v: '-1', o: { strict: true, defaultValue: null }, e: typeError },
      { v: '-0', o: { strict: true, defaultValue: null }, e: typeError },
      { v: '0', o: { strict: true, defaultValue: null }, e: typeError },
      { v: '1', o: { strict: true, defaultValue: null }, e: typeError },
      { v: intString, o: { strict: true, defaultValue: null }, e: typeError },
      { v: ' ' + intString, o: { strict: true, defaultValue: null }, e: typeError },
      { v: intString + ' ', o: { strict: true, defaultValue: null }, e: typeError },
      { v: '-' + numString, o: { strict: true, defaultValue: null }, e: typeError },
      { v: '-1.1', o: { strict: true, defaultValue: null }, e: typeError },
      { v: '-1.0', o: { strict: true, defaultValue: null }, e: typeError },
      { v: '1.0', o: { strict: true, defaultValue: null }, e: typeError },
      { v: '1.1', o: { strict: true, defaultValue: null }, e: typeError },
      { v: numString, o: { strict: true, defaultValue: null }, e: typeError },
      { v: 'x' + intString, o: { strict: true, defaultValue: null }, e: typeError },
      { v: intString + 'x', o: { strict: true, defaultValue: null }, e: typeError },
      { v: str, o: { strict: true, defaultValue: null }, e: typeError },
      { v: array, o: { strict: true, defaultValue: null }, e: typeError },
      { v: object, o: { strict: true, defaultValue: null }, e: typeError },
      { v: func, o: { strict: true, defaultValue: null }, e: typeError },
      { v: instance, o: { strict: true, defaultValue: null }, e: typeError },
      { v: SubClass, o: { strict: true, defaultValue: null }, e: typeError },
      // options.userInput: false
      { o: { userInput: false }, e: typeErrorMissingValue },
      { v: null, o: { userInput: false }, e: typeErrorMissingValue },
      { v: false, o: { userInput: false }, r: 0 },
      { v: true, o: { userInput: false }, r: 1 },
      { v: -int, o: { userInput: false }, r: -int },
      { v: -1, o: { userInput: false }, r: -1 },
      { v: -0, o: { userInput: false }, r: -0 },
      { v: 0, o: { userInput: false }, r: 0 },
      { v: 1, o: { userInput: false }, r: 1 },
      { v: int, o: { userInput: false }, r: int },
      { v: -Infinity, o: { userInput: false }, e: typeError },
      { v: -num, o: { userInput: false }, e: typeError },
      { v: -1.1, o: { userInput: false }, e: typeError },
      { v: -1.0, o: { userInput: false }, r: -1 },
      { v: 1.0, o: { userInput: false }, r: 1 },
      { v: 1.1, o: { userInput: false }, e: typeError },
      { v: num, o: { userInput: false }, e: typeError },
      { v: Infinity, o: { userInput: false }, e: typeError },
      { v: NaN, o: { userInput: false }, e: typeError },
      { v: '-' + intString, o: { userInput: false }, r: -int },
      { v: '-1', o: { userInput: false }, r: -1 },
      { v: '-0', o: { userInput: false }, r: -0 },
      { v: '0', o: { userInput: false }, r: 0 },
      { v: '1', o: { userInput: false }, r: 1 },
      { v: intString, o: { userInput: false }, r: int },
      { v: ' ' + intString, o: { userInput: false }, r: int },
      { v: intString + ' ', o: { userInput: false }, r: int },
      { v: '-' + numString, o: { userInput: false }, e: typeError },
      { v: '-1.1', o: { userInput: false }, e: typeError },
      { v: '-1.0', o: { userInput: false }, r: -1 },
      { v: '1.0', o: { userInput: false }, r: 1 },
      { v: '1.1', o: { userInput: false }, e: typeError },
      { v: numString, o: { userInput: false }, e: typeError },
      { v: 'x' + intString, o: { userInput: false }, e: typeError },
      { v: intString + 'x', o: { userInput: false }, e: typeError },
      { v: str, o: { userInput: false }, e: typeError },
      { v: array, o: { userInput: false }, e: typeError },
      { v: object, o: { userInput: false }, e: typeError },
      { v: func, o: { userInput: false }, e: typeError },
      { v: instance, o: { userInput: false }, e: typeError },
      { v: SubClass, o: { userInput: false }, e: typeError },
      // options.userInput: true
      { o: { userInput: true }, e: userInputErrorMissingValue },
      { v: null, o: { userInput: true }, e: userInputErrorMissingValue },
      { v: false, o: { userInput: true }, r: 0 },
      { v: true, o: { userInput: true }, r: 1 },
      { v: -int, o: { userInput: true }, r: -int },
      { v: -1, o: { userInput: true }, r: -1 },
      { v: -0, o: { userInput: true }, r: -0 },
      { v: 0, o: { userInput: true }, r: 0 },
      { v: 1, o: { userInput: true }, r: 1 },
      { v: int, o: { userInput: true }, r: int },
      { v: -Infinity, o: { userInput: true }, e: userInputError },
      { v: -num, o: { userInput: true }, e: userInputError },
      { v: -1.1, o: { userInput: true }, e: userInputError },
      { v: -1.0, o: { userInput: true }, r: -1 },
      { v: 1.0, o: { userInput: true }, r: 1 },
      { v: 1.1, o: { userInput: true }, e: userInputError },
      { v: num, o: { userInput: true }, e: userInputError },
      { v: Infinity, o: { userInput: true }, e: userInputError },
      { v: NaN, o: { userInput: true }, e: userInputError },
      { v: '-' + intString, o: { userInput: true }, r: -int },
      { v: '-1', o: { userInput: true }, r: -1 },
      { v: '-0', o: { userInput: true }, r: -0 },
      { v: '0', o: { userInput: true }, r: 0 },
      { v: '1', o: { userInput: true }, r: 1 },
      { v: intString, o: { userInput: true }, r: int },
      { v: ' ' + intString, o: { userInput: true }, r: int },
      { v: intString + ' ', o: { userInput: true }, r: int },
      { v: '-' + numString, o: { userInput: true }, e: userInputError },
      { v: '-1.1', o: { userInput: true }, e: userInputError },
      { v: '-1.0', o: { userInput: true }, r: -1 },
      { v: '1.0', o: { userInput: true }, r: 1 },
      { v: '1.1', o: { userInput: true }, e: userInputError },
      { v: numString, o: { userInput: true }, e: userInputError },
      { v: 'x' + intString, o: { userInput: true }, e: userInputError },
      { v: intString + 'x', o: { userInput: true }, e: userInputError },
      { v: str, o: { userInput: true }, e: userInputError },
      { v: array, o: { userInput: true }, e: userInputError },
      { v: object, o: { userInput: true }, e: userInputError },
      { v: func, o: { userInput: true }, e: userInputError },
      { v: instance, o: { userInput: true }, e: userInputError },
      { v: SubClass, o: { userInput: true }, e: userInputError },
      // options.minimumValue: 1
      { o: { minimumValue: 1 }, e: typeErrorMissingValue },
      { v: null, o: { minimumValue: 1 }, e: typeErrorMissingValue },
      { v: false, o: { minimumValue: 1 }, r: 1 },
      { v: true, o: { minimumValue: 1 }, r: 1 },
      { v: -int, o: { minimumValue: 1 }, r: 1 },
      { v: -1, o: { minimumValue: 1 }, r: 1 },
      { v: -0, o: { minimumValue: 1 }, r: 1 },
      { v: 0, o: { minimumValue: 1 }, r: 1 },
      { v: 1, o: { minimumValue: 1 }, r: 1 },
      { v: int, o: { minimumValue: 1 }, r: int },
      { v: -Infinity, o: { minimumValue: 1 }, e: typeError },
      { v: -num, o: { minimumValue: 1 }, e: typeError },
      { v: -1.1, o: { minimumValue: 1 }, e: typeError },
      { v: -1.0, o: { minimumValue: 1 }, r: 1 },
      { v: 1.0, o: { minimumValue: 1 }, r: 1 },
      { v: 1.1, o: { minimumValue: 1 }, e: typeError },
      { v: num, o: { minimumValue: 1 }, e: typeError },
      { v: Infinity, o: { minimumValue: 1 }, e: typeError },
      { v: NaN, o: { minimumValue: 1 }, e: typeError },
      { v: '-' + intString, o: { minimumValue: 1 }, r: 1 },
      { v: '-1', o: { minimumValue: 1 }, r: 1 },
      { v: '-0', o: { minimumValue: 1 }, r: 1 },
      { v: '0', o: { minimumValue: 1 }, r: 1 },
      { v: '1', o: { minimumValue: 1 }, r: 1 },
      { v: intString, o: { minimumValue: 1 }, r: int },
      { v: ' ' + intString, o: { minimumValue: 1 }, r: int },
      { v: intString + ' ', o: { minimumValue: 1 }, r: int },
      { v: '-' + numString, o: { minimumValue: 1 }, e: typeError },
      { v: '-1.1', o: { minimumValue: 1 }, e: typeError },
      { v: '-1.0', o: { minimumValue: 1 }, r: 1 },
      { v: '1.0', o: { minimumValue: 1 }, r: 1 },
      { v: '1.1', o: { minimumValue: 1 }, e: typeError },
      { v: numString, o: { minimumValue: 1 }, e: typeError },
      { v: 'x' + intString, o: { minimumValue: 1 }, e: typeError },
      { v: intString + 'x', o: { minimumValue: 1 }, e: typeError },
      { v: str, o: { minimumValue: 1 }, e: typeError },
      { v: array, o: { minimumValue: 1 }, e: typeError },
      { v: object, o: { minimumValue: 1 }, e: typeError },
      { v: func, o: { minimumValue: 1 }, e: typeError },
      { v: instance, o: { minimumValue: 1 }, e: typeError },
      { v: SubClass, o: { minimumValue: 1 }, e: typeError },
      // options.minimumValue: 1, options.strict: true
      { o: { minimumValue: 1, strict: true }, e: typeErrorMissingValue },
      { v: null, o: { minimumValue: 1, strict: true }, e: typeErrorMissingValue },
      { v: false, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: true, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: -int, o: { minimumValue: 1, strict: true }, e: rangeErrorMin },
      { v: -1, o: { minimumValue: 1, strict: true }, e: rangeErrorMin },
      { v: -0, o: { minimumValue: 1, strict: true }, e: rangeErrorMin },
      { v: 0, o: { minimumValue: 1, strict: true }, e: rangeErrorMin },
      { v: 1, o: { minimumValue: 1, strict: true }, r: 1 },
      { v: int, o: { minimumValue: 1, strict: true }, r: int },
      { v: -Infinity, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: -num, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: -1.1, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: -1.0, o: { minimumValue: 1, strict: true }, e: rangeErrorMin },
      { v: 1.0, o: { minimumValue: 1, strict: true }, r: 1 },
      { v: 1.1, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: num, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: Infinity, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: NaN, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: '-' + intString, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: '-1', o: { minimumValue: 1, strict: true }, e: typeError },
      { v: '-0', o: { minimumValue: 1, strict: true }, e: typeError },
      { v: '0', o: { minimumValue: 1, strict: true }, e: typeError },
      { v: '1', o: { minimumValue: 1, strict: true }, e: typeError },
      { v: intString, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: ' ' + intString, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: intString + ' ', o: { minimumValue: 1, strict: true }, e: typeError },
      { v: '-' + numString, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: '-1.1', o: { minimumValue: 1, strict: true }, e: typeError },
      { v: '-1.0', o: { minimumValue: 1, strict: true }, e: typeError },
      { v: '1.0', o: { minimumValue: 1, strict: true }, e: typeError },
      { v: '1.1', o: { minimumValue: 1, strict: true }, e: typeError },
      { v: numString, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: 'x' + intString, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: intString + 'x', o: { minimumValue: 1, strict: true }, e: typeError },
      { v: str, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: array, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: object, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: func, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: instance, o: { minimumValue: 1, strict: true }, e: typeError },
      { v: SubClass, o: { minimumValue: 1, strict: true }, e: typeError },
      // options.maximumValue: 0
      { o: { maximumValue: 0 }, e: typeErrorMissingValue },
      { v: null, o: { maximumValue: 0 }, e: typeErrorMissingValue },
      { v: false, o: { maximumValue: 0 }, r: 0 },
      { v: true, o: { maximumValue: 0 }, r: 0 },
      { v: -int, o: { maximumValue: 0 }, r: -int },
      { v: -1, o: { maximumValue: 0 }, r: -1 },
      { v: -0, o: { maximumValue: 0 }, r: -0 },
      { v: 0, o: { maximumValue: 0 }, r: 0 },
      { v: 1, o: { maximumValue: 0 }, r: 0 },
      { v: int, o: { maximumValue: 0 }, r: 0 },
      { v: -Infinity, o: { maximumValue: 0 }, e: typeError },
      { v: -num, o: { maximumValue: 0 }, e: typeError },
      { v: -1.1, o: { maximumValue: 0 }, e: typeError },
      { v: -1.0, o: { maximumValue: 0 }, r: -1 },
      { v: 1.0, o: { maximumValue: 0 }, r: 0 },
      { v: 1.1, o: { maximumValue: 0 }, e: typeError },
      { v: num, o: { maximumValue: 0 }, e: typeError },
      { v: Infinity, o: { maximumValue: 0 }, e: typeError },
      { v: NaN, o: { maximumValue: 0 }, e: typeError },
      { v: '-' + intString, o: { maximumValue: 0 }, r: -int },
      { v: '-1', o: { maximumValue: 0 }, r: -1 },
      { v: '-0', o: { maximumValue: 0 }, r: -0 },
      { v: '0', o: { maximumValue: 0 }, r: 0 },
      { v: '1', o: { maximumValue: 0 }, r: 0 },
      { v: intString, o: { maximumValue: 0 }, r: 0 },
      { v: ' ' + intString, o: { maximumValue: 0 }, r: 0 },
      { v: intString + ' ', o: { maximumValue: 0 }, r: 0 },
      { v: '-' + numString, o: { maximumValue: 0 }, e: typeError },
      { v: '-1.1', o: { maximumValue: 0 }, e: typeError },
      { v: '-1.0', o: { maximumValue: 0 }, r: -1 },
      { v: '1.0', o: { maximumValue: 0 }, r: 0 },
      { v: '1.1', o: { maximumValue: 0 }, e: typeError },
      { v: numString, o: { maximumValue: 0 }, e: typeError },
      { v: 'x' + intString, o: { maximumValue: 0 }, e: typeError },
      { v: intString + 'x', o: { maximumValue: 0 }, e: typeError },
      { v: str, o: { maximumValue: 0 }, e: typeError },
      { v: array, o: { maximumValue: 0 }, e: typeError },
      { v: object, o: { maximumValue: 0 }, e: typeError },
      { v: func, o: { maximumValue: 0 }, e: typeError },
      { v: instance, o: { maximumValue: 0 }, e: typeError },
      { v: SubClass, o: { maximumValue: 0 }, e: typeError },
      // options.maximumValue: 0, options.strict: true
      { o: { maximumValue: 0, strict: true }, e: typeErrorMissingValue },
      { v: null, o: { maximumValue: 0, strict: true }, e: typeErrorMissingValue },
      { v: false, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: true, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: -int, o: { maximumValue: 0, strict: true }, r: -int },
      { v: -1, o: { maximumValue: 0, strict: true }, r: -1 },
      { v: -0, o: { maximumValue: 0, strict: true }, r: -0 },
      { v: 0, o: { maximumValue: 0, strict: true }, r: 0 },
      { v: 1, o: { maximumValue: 0, strict: true }, e: rangeErrorMax },
      { v: int, o: { maximumValue: 0, strict: true }, e: rangeErrorMax },
      { v: -Infinity, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: -num, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: -1.1, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: -1.0, o: { maximumValue: 0, strict: true }, r: -1 },
      { v: 1.0, o: { maximumValue: 0, strict: true }, e: rangeErrorMax },
      { v: 1.1, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: num, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: Infinity, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: NaN, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: '-' + intString, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: '-1', o: { maximumValue: 0, strict: true }, e: typeError },
      { v: '-0', o: { maximumValue: 0, strict: true }, e: typeError },
      { v: '0', o: { maximumValue: 0, strict: true }, e: typeError },
      { v: '1', o: { maximumValue: 0, strict: true }, e: typeError },
      { v: intString, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: ' ' + intString, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: intString + ' ', o: { maximumValue: 0, strict: true }, e: typeError },
      { v: '-' + numString, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: '-1.1', o: { maximumValue: 0, strict: true }, e: typeError },
      { v: '-1.0', o: { maximumValue: 0, strict: true }, e: typeError },
      { v: '1.0', o: { maximumValue: 0, strict: true }, e: typeError },
      { v: '1.1', o: { maximumValue: 0, strict: true }, e: typeError },
      { v: numString, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: 'x' + intString, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: intString + 'x', o: { maximumValue: 0, strict: true }, e: typeError },
      { v: str, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: array, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: object, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: func, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: instance, o: { maximumValue: 0, strict: true }, e: typeError },
      { v: SubClass, o: { maximumValue: 0, strict: true }, e: typeError },
      // options combo
      { v: 0, o: { minimumValue: 1, maximumValue: 3, strict: true, userInput: true }, e: new UserInputError('invalid integer value: below 1') },
      { v: 2, o: { minimumValue: 1, maximumValue: 3, strict: true, userInput: true }, r: 2 },
      { v: 4, o: { minimumValue: 1, maximumValue: 3, strict: true, userInput: true }, e: new UserInputError('invalid integer value: above 3') },
      // invalid options
      { o: { strict: 'maybe' }, e: new TypeError('options.strict: not a boolean') },
      { o: { defaultValue: undefined }, e: new TypeError('options.defaultValue: missing integer value') },
      { o: { defaultValue: 1.1 }, e: new TypeError('options.defaultValue: not an integer') },
      { o: { userInput: 'maybe' }, e: new TypeError('options.userInput: not a boolean') },
      { o: { mandatory: false }, e: new TypeError('options.mandatory: invalid key') },
      { o: { minimumValue: null }, e: new TypeError('options.minimumValue: missing integer value') },
      { o: { minimumValue: 1.1 }, e: new TypeError('options.minimumValue: not an integer') },
      { o: { maximumValue: null }, e: new TypeError('options.maximumValue: missing integer value') },
      { o: { maximumValue: 1.1 }, e: new TypeError('options.maximumValue: not an integer') },
      { o: { minimumValue: 1, maximumValue: 0 }, e: new RangeError('options.maximumValue: invalid integer value: below 1') },
      { o: { defaultValue: 0, minimumValue: 1, maximumValue: 3 }, e: new RangeError('options.defaultValue: invalid integer value: below 1') },
      { o: { defaultValue: 4, minimumValue: 1, maximumValue: 3 }, e: new RangeError('options.defaultValue: invalid integer value: above 3') }
    ])
  })
  describe('.toNumber()', function () {
    const typeErrorMissingValue = new TypeError('missing number value')
    const userInputErrorMissingValue = new UserInputError('missing number value')
    const typeError = new TypeError('not a number')
    test(TypeParser.toNumber, [
      { e: typeErrorMissingValue },
      { v: null, e: typeErrorMissingValue },
      { v: false, r: 0 },
      { v: true, r: 1 },
      { v: -int, r: -int },
      { v: -1, r: -1 },
      { v: -0, r: -0 },
      { v: 0, r: 0 },
      { v: 1, r: 1 },
      { v: int, r: int },
      { v: -Infinity, e: typeError },
      { v: -num, r: -num },
      { v: -1.1, r: -1.1 },
      { v: -1.0, r: -1 },
      { v: 1.0, r: 1 },
      { v: 1.1, r: 1.1 },
      { v: num, r: num },
      { v: Infinity, e: typeError },
      { v: '-' + intString, r: -int },
      { v: '-1', r: -1 },
      { v: '-0', r: -0 },
      { v: '0', r: 0 },
      { v: '1', r: 1 },
      { v: intString, r: int },
      { v: ' 1', r: 1 },
      { v: '1 ', r: 1 },
      { v: 'x1', e: typeError },
      { v: '1x', e: typeError },
      { v: '-' + numString, r: -num },
      { v: '-1.1', r: -1.1 },
      { v: '-1.0', r: -1 },
      { v: '1.0', r: 1 },
      { v: '1.1', r: 1.1 },
      { v: numString, r: num },
      { v: str, e: typeError },
      { v: array, e: typeError },
      { v: object, e: typeError },
      { v: func, e: typeError },
      { v: instance, e: typeError },
      { v: SubClass, e: typeError },
      { o: { userInput: false }, e: typeErrorMissingValue },
      { o: { userInput: true }, e: userInputErrorMissingValue },
      { o: { userInput: 'maybe' }, e: new TypeError('options.userInput: not a boolean') },
      { v: '0', o: { minimumValue: 1, maximumValue: 3 }, r: 1 },
      { v: '2', o: { minimumValue: 1, maximumValue: 3 }, r: 2 },
      { v: '4', o: { minimumValue: 1, maximumValue: 3 }, r: 3 },
      { v: 0, o: { strict: true, minimumValue: 1, maximumValue: 3 }, e: new RangeError('invalid number value: below 1') },
      { v: 2, o: { strict: true, minimumValue: 1, maximumValue: 3 }, r: 2 },
      { v: 4, o: { strict: true, minimumValue: 1, maximumValue: 3 }, e: new RangeError('invalid number value: above 3') },
      { o: { minimumValue: 'x', maximumValue: 3 }, e: new TypeError('options.minimumValue: not a number') },
      { o: { minimumValue: 1, maximumValue: 'x' }, e: new TypeError('options.maximumValue: not a number') },
      { o: { minimumValue: 3, maximumValue: 1 }, e: new RangeError('options.maximumValue: invalid number value: below 3') },
      { o: { defaultValue: 0, minimumValue: 1 }, e: new RangeError('options.defaultValue: invalid number value: below 1') },
      { o: { nonEmpty: false }, e: new TypeError('options.nonEmpty: invalid key') },
      { o: { badKey: false }, e: new TypeError('options.badKey: invalid key') }
    ])
  })
  describe('.toString()', function () {
    const typeErrorMissingValue = new TypeError('missing string value')
    const userInputErrorMissingValue = new UserInputError('missing string value')
    const typeError = new TypeError('not a string')
    test(TypeParser.toString, [
      { e: typeErrorMissingValue },
      { v: null, e: typeErrorMissingValue },
      { v: bool, r: boolString },
      { v: int, r: intString },
      { v: num, r: numString },
      { v: '', r: '' },
      { v: str, r: str },
      { v: array, e: typeError },
      { v: object, e: typeError },
      { v: func, e: typeError },
      { v: instance, e: typeError },
      { v: SubClass, e: typeError },
      { o: { userInput: false }, e: typeErrorMissingValue },
      { o: { userInput: true }, e: userInputErrorMissingValue },
      { o: { userInput: 'maybe' }, e: new TypeError('options.userInput: not a boolean') },
      { v: '', o: { nonEmpty: false }, r: '' },
      { v: '', o: { nonEmpty: true }, e: new RangeError('invalid empty string') },
      { v: '', o: { nonEmpty: true, userInput: true }, e: new UserInputError('invalid empty string') },
      { o: { nonEmpty: 'maybe' }, e: new TypeError('options.nonEmpty: not a boolean') },
      { o: { badKey: false }, e: new TypeError('options.badKey: invalid key') }
    ])
  })
  describe.skip('.toIpv4()', function () {
    const typeErrorMissingValue = new TypeError('missing ipv4 value')
    // const userInputErrorMissingValue = new UserInputError('missing ipv4 value')
    // const typeError = new TypeError('not a string')
    const rangeError = new RangeError('invalid ipv4 address')
    test(TypeParser.toIpv4, [
      { e: typeErrorMissingValue },
      { v: '127.0.0.1', s: [127, 0, 0, 1] },
      { v: '127.000.000.001', s: [127, 0, 0, 1] },
      { v: '192.168.1.100', s: [192, 168, 1, 100] },
      { v: '127.0.0.1', o: { asString: true }, r: '127.0.0.1' },
      { v: '127.000.000.001', o: { asString: true }, r: '127.0.0.1' },
      { v: '192.168.1.100', o: { asString: true }, r: '192.168.1.100' },
      { v: '1.1.1', e: rangeError },
      { v: '1.1.1.256', e: rangeError },
      { v: '1.1.256.1', e: rangeError },
      { v: '1.256.1.1', e: rangeError },
      { v: '256.1.1.1', e: rangeError },
      { v: '1.1.1.1.1', e: rangeError }
    ])
  })
  describe.skip('.toHost()', function () {
    const typeErrorMissingValue = new TypeError('missing host value')
    const userInputErrorMissingValue = new UserInputError('missing host value')
    const typeError = new TypeError('not a string')
    const rangeError = new RangeError('invalid host')
    test(TypeParser.toHost, [
      { e: typeErrorMissingValue },
      { v: null, e: typeErrorMissingValue },
      { v: bool, e: typeError },
      { v: int, e: typeError },
      { v: num, e: typeError },
      { v: '', e: new RangeError('invalid empty string') },
      { v: '', o: { userInput: true }, e: new UserInputError('invalid empty string') },
      { v: str, s: { hostname: str } },
      { v: str, o: { asString: true }, s: str },
      { v: str + ':' + intString, s: { hostname: str, port: int } },
      { v: str + ':' + intString, o: { asString: true }, s: str + ':' + intString },
      { v: '127.0.0.1', s: { hostname: '127.0.0.1' } },
      { v: '127.0.0.1', o: { asString: true }, s: '127.0.0.1' },
      { v: '127.0.0.1:' + intString, s: { hostname: '127.0.0.1', port: int } },
      { v: '127.0.0.1:' + intString, o: { asString: true }, s: '127.0.0.1:' + intString },
      { v: ':' + intString, s: { port: int } },
      { v: ':' + intString, o: { asString: true }, s: ':' + intString },
      { v: ':-' + intString, e: rangeError },
      { v: ':' + numString, e: rangeError },
      { v: ':80001', e: new RangeError('port: invalid integer value: above 65535') },
      { v: ':x', e: rangeError },
      { v: str + ':', e: rangeError },
      { v: ':', e: rangeError },
      { v: array, e: typeError },
      { v: object, e: typeError },
      { v: func, e: typeError },
      { v: instance, e: typeError },
      { v: SubClass, e: typeError },
      { o: { userInput: false }, e: typeErrorMissingValue },
      { o: { userInput: true }, e: userInputErrorMissingValue },
      { o: { userInput: 'maybe' }, e: new TypeError('options.userInput: not a boolean') },
      { o: { nonEmpty: false }, e: new TypeError('options.nonEmpty: invalid key') },
      { o: { badKey: false }, e: new TypeError('options.badKey: invalid key') }
    ])
  })
  describe.skip('.toPath()', function () {
    const typeErrorMissingValue = new TypeError('missing path value')
    const userInputErrorMissingValue = new UserInputError('missing path value')
    const typeError = new TypeError('not a string')
    test(TypeParser.toPath, [
      { e: typeErrorMissingValue },
      { v: null, e: typeErrorMissingValue },
      { v: bool, e: typeError },
      { v: int, e: typeError },
      { v: num, e: typeError },
      { v: '', s: ['.'] },
      { v: '', o: { nonEmpty: false }, s: ['.'] },
      { v: '', o: { nonEmpty: true }, e: new RangeError('invalid empty string') },
      { v: '', o: { nonEmpty: true, userInput: true }, e: new UserInputError('invalid empty string') },
      { v: '', o: { nonEmpty: 'maybe' }, e: new TypeError('options.nonEmpty: not a boolean') },
      { v: str, s: [str] },
      { v: str, o: { absolute: true }, e: new RangeError('invalid absolute path value') },
      { v: '/', s: ['/'] },
      { v: '/', o: { absolute: true }, s: ['/'] },
      { v: '/path/to', s: ['/', 'path', 'to'] },
      { v: '/path/to', o: { absolute: true }, s: ['/', 'path', 'to'] },
      { v: '//path//to//', s: ['/', 'path', 'to'] },
      { v: '//path//to//', o: { strict: true }, e: new RangeError('invalid path value') },
      { v: '/', o: { asString: true }, s: '/' },
      { v: 'x/..', s: ['.'] },
      { v: 'x/..', o: { asString: true }, s: '.' },
      { v: '//path//to//', s: ['/', 'path', 'to'] },
      { v: '//path//to//', o: { asString: true }, s: '/path/to' },
      { v: './/path//to//', s: ['path', 'to'] },
      { v: './/path//to//', o: { asString: true }, s: 'path/to' },
      { v: array, e: typeError },
      { v: object, e: typeError },
      { v: func, e: typeError },
      { v: instance, e: typeError },
      { v: SubClass, e: typeError },
      { o: { userInput: false }, e: typeErrorMissingValue },
      { o: { userInput: true }, e: userInputErrorMissingValue },
      { o: { userInput: 'maybe' }, e: new TypeError('options.userInput: not a boolean') },
      { o: { badKey: false }, e: new TypeError('options.badKey: invalid key') }
    ])
  })
  describe('.toArray()', function () {
    // const typeErrorMissingValue = new TypeError('missing array value')
    // const userInputErrorMissingValue = new UserInputError('missing array value')
    // const typeError = new TypeError('not an array')
    test(TypeParser.toArray, [
      { s: [] },
      { v: null, s: [] },
      { v: bool, s: [bool] },
      { v: int, s: [int] },
      { v: num, s: [num] },
      { v: str, s: [str] },
      { v: array, s: array },
      { v: object, s: [object] },
      { v: func, s: [func] },
      { v: instance, s: [instance] },
      { v: SubClass, s: [SubClass] }
    ])
  })
  describe('.toObject()', function () {
    const typeErrorMissingValue = new TypeError('missing object value')
    // const userInputErrorMissingValue = new UserInputError('missing object value')
    const typeError = new TypeError('not an object')
    test(TypeParser.toObject, [
      { e: typeErrorMissingValue },
      { v: null, e: typeErrorMissingValue },
      { v: bool, e: typeError },
      { v: int, e: typeError },
      { v: num, e: typeError },
      { v: str, e: typeError },
      { v: array, e: typeError },
      { v: object, a: new TypeError('a: invalid key') },
      { v: func, e: typeError },
      { v: instance, e: typeError },
      { v: SubClass, e: typeError }
    ])
  })
  describe('.toFunction()', function () {
    const typeErrorMissingValue = new TypeError('missing function value')
    const typeError = new TypeError('not a function')
    test(TypeParser.toFunction, [
      { e: typeErrorMissingValue },
      { v: null, e: typeErrorMissingValue },
      { v: bool, e: typeError },
      { v: int, e: typeError },
      { v: num, e: typeError },
      { v: str, e: typeError },
      { v: array, e: typeError },
      { v: object, e: typeError },
      { v: func, r: func },
      { v: instance, e: typeError },
      { v: SubClass, r: SubClass }
    ])
  })
  describe('.toInstance()', function () {
    const typeErrorMissingValue = new TypeError('missing instance value')
    const typeError = new TypeError('not an instance')
    test(TypeParser.toInstance, [
      { e: typeErrorMissingValue },
      { v: null, e: typeErrorMissingValue },
      { v: bool, e: typeError },
      { v: int, e: typeError },
      { v: num, e: typeError },
      { v: str, e: typeError },
      { v: array, e: typeError },
      { v: object, e: typeError },
      { v: func, e: typeError },
      { v: instance, r: instance },
      { v: instance, o: { class: SubClass }, r: instance },
      { v: instance, o: { class: SuperClass }, r: instance },
      { v: instance, o: { class: OtherClass }, e: new TypeError('not an instance of OtherClass') },
      { v: typeError, r: typeError },
      { v: typeError, o: { class: TypeError }, r: typeError },
      { v: typeError, o: { class: Error }, r: typeError },
      { v: typeError, o: { class: UserInputError }, e: new TypeError('not an instance of UserInputError') },
      { v: SubClass, e: typeError }
    ])
  })
  describe('.toClass()', function () {
    const typeErrorMissingValue = new TypeError('missing class value')
    const typeError = new TypeError('not a class')
    test(TypeParser.toClass, [
      { e: typeErrorMissingValue },
      { v: null, e: typeErrorMissingValue },
      { v: bool, e: typeError },
      { v: int, e: typeError },
      { v: num, e: typeError },
      { v: str, e: typeError },
      { v: array, e: typeError },
      { v: object, e: typeError },
      { v: func, r: func },
      { v: instance, e: typeError },
      { v: SubClass, r: SubClass },
      { v: SubClass, o: { class: SubClass }, r: SubClass },
      { v: SubClass, o: { class: SuperClass }, r: SubClass },
      { v: SubClass, o: { class: OtherClass }, e: new TypeError('not a subclass of OtherClass') },
      { v: TypeError, r: TypeError },
      { v: TypeError, o: { class: TypeError }, r: TypeError },
      { v: TypeError, o: { class: Error }, r: TypeError },
      { v: UserInputError, r: UserInputError },
      { v: UserInputError, o: { class: UserInputError }, r: UserInputError },
      { v: UserInputError, o: { class: Error }, r: UserInputError },
      { v: UserInputError, o: { class: TypeError }, e: new TypeError('not a subclass of TypeError') }
    ])
  })
  describe('#parse()', function () {
    //
  })
})
