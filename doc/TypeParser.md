Copyright © 2017-2019 Erik Baauw. All rights reserved.

## Introduction
`TypeParser` parses values of expressions or variables of a Javascript program.
It checks whether these values are of the appropriate type, possibly converting them if they are not.
`TypeParser` validates user input and helps to identify bugs, undetected because of Javascript's [weak typing](https://en.wikipedia.org/wiki/Strong_and_weak_typing).
`TypeParser` types are far more sophisticated than a native Javascript types.

### The Issue
Imagine we have a function `foo()`, that takes an argument `n`, which should hold a non-negative integer.
Traditionally, `foo()` would have to check and correct the value of its argument:
```javascript
function foo (n) {
  if (typeof n === 'boolean') {
    n = n ? 1 : 0 // convert boolean to integer
  } else if (typeof n === 'string') {
    n = parseInt(n) // convert string to integer
  }
  if (typeof n !== 'number' || !Number.isInteger(n)) { // check that n is integer
    throw new TypeError('not an integer')
  }
  n = n < 0 ? 0 : n // maximise n with 0
  // now, for sure, n holds a non-negative integer
}
```
This requires quite some lines of code, but at least this accepts `42`, `'42'`, `' 42'`, or `'42 '`.
However, this also wrongly accepts `'42.1'`, but not `42.1`.
Better fix that:
```javascript
function foo (n) {
  if (typeof n === 'boolean') {
    n = n ? 1 : 0 // convert boolean to integer
  } else if (typeof n === 'string') {
    n = parseFloat(n) // convert string to number (!)
  }
  if (typeof n !== 'number' || !Number.isInteger(n)) { // check that n is integer
    throw new TypeError('not an integer')
  }
  n = n < 0 ? 0 : n // maximise n with 0
  // now, for sure, n holds a non-negative integer
}
```
Cool, this accepts `42`, `'42'`, `'42 '`, or `' 42'`, but not `42.1` or `'42.1'`.
However, this still wrongly accepts `'42 monkeys'`.
Better fix that as well:
```javascript
function foo (n) {
  if (typeof n === 'boolean') {
    n = n ? 1 : 0 // convert boolean to integer
  } else if (typeof n === 'string' && n.trim() === parseFloat(n).toString()) {
    n = parseFloat(n) // convert string to number (!)
  }
  if (typeof n !== 'number' || !Number.isInteger(n)) { // check that n is integer
    throw new TypeError('not an integer')
  }
  n = n < 0 ? 0 : n // maximise n with 0
  // now, for sure, n holds a non-negative integer
}
```
That's a lot of effort for a relatively simple check, not spent on implementing `foo()`'s real functionality.
Now imagine having many functions needing a similar check...

### Base Types
The idea behind `TypeParser` is to keep your code as clean as possible, while still safe.
In the above example, `foo()` would only need a single line of code:
```javascript
function foo (n) {
  n = TypeParser.toInteger(n, { minimumValue: 0 })
  // now, for sure, n holds a non-negative integer
}
```
If needed and possible, the value is converted to the appropriate type, as in the previous example.
If the value cannot be converted, e.g. when calling `foo('fourty-two')`, a `TypeError` is thrown, instead of returning `null`, `NaN`, or some other error return value.
There's no need for `foo()` to check the return value of `toInteger()`.

`TypeParser` provides a similar class method for each base type, like `toAny()`, `toBoolean()`, `toNumber()`, `toString()`, `toArray()`, and `toObject()`.
Each method takes two parameters:
- `value` - The value to be checked; and
- `options` - Additional type properties.

These properties are passed as an `object` with a key/value pair for each type property (like `minimumValue: 0` to define a minimum value of `0`).

### Custom-Defined Types
Instances of `TypeParser` validate a value against a base type with pre-defined properties.
This comes in handy, when multiple values of the same type need to be validated.
The type properties passed once, to the constructor, instead of many times, with each validation:
```javascript
const nonNegativeIntegerParser = new TypeParser({
  type: TypeParser.Type.integer,
  minimumValue: 0
})

function foo (n) {
  n = nonNegativeIntegerParser.parse(n)
  // now, for sure, n holds a non-negative integer
}

function bar (n) {
  n = nonNegativeIntegerParser.parse(n)
  // now, for sure, n holds a non-negative integer
}
```
The constructor takes a single parameter, `definition` for the type properties.
Again, these properties are passed as an `object` with a key/value pair for each type property.
The `type` property indicates the base type, in our example: `TypeParser.Type.integer` for an integer.

The `parse()` method takes two parameters:
- `value` - The value to be checked; and
- `options` - Additional validation options.

### Nested Types
While pre-defining a custom type might seem a bit overdone for a simple non-negative integer, it really helps in more complex cases, e.g. when a function takes an `options` argument:
```javascript
const nonNegativeIntegerParser = new TypeParser({
  type: TypeParser.Type.integer,
  minimumValue: 0
})
const optionsParser = new TypeParser({
  type: TypeParser.Type.object,
  properties: {
    timeout: {
      type: TypeParser.Type.integer,
      minimumValue: 5,
      maximumValue: 120,
      defaultValue: 15
    },
    // many other options
  }
})

function foo (n, options = {}) {
  n = nonNegativeIntegerParser.parse(n)
  options = optionsParser.parse(options)
  // now, for sure, options.timeout is an integer value between 5 and 120
}
```
After the call to `optionsParser.parse()`, `options.timeout` is guaranteed to have a valid value, even when it wasn't specified (in which case the default value is assigned), when it was too small or too big (in which case minimum or maximum value is assigned), or when it held a `string` value (in which case the string value is converted to a `number` and then further validated).

### Default vs Strict Validation
By default, `TypeParser` tries to convert a value to the appropriate type, e.g. by:
- Adding a default value for a missing property;
- Converting between `boolean`, `number`, and `string` values;
- Maximising or minimising a value with a defined minimum or maximum value;
- Casting a string to the desired case;
- Converting `null` to an empty array, or a non-array value to an array with one element.

While these conversions increase user experience when parsing user input, they might hide programming errors.
To prevent `TypeParser` from doing conversions, add `strict: true` to the type definition or to the options to `toInteger()` and alike or to `parse()`.

### User Input
The values to be validated might be input by a user (e.g. homebridge's `config.json`), or generated by a program (e.g. the `options` parameter to a function).
Of course, `TypeParser` validates the type definitions as well as the value.
To distinguish between user input exceptions on the value versus program errors on the type definitions, add `userInput: true` to the `definitions` or `options`.
This causes `TypeParser` to throw a `UserInputError` instead of a `TypeError` or `RangeError` on invalid user input.

Note that the `error()` methods of `Delegate` and `CommandLineUtility` understand the difference between exceptions and errors.
The only output a stack trace for errors.

### Error Events
When validating a custom value type based on an `array` or `object`, `TypeParser` continues checking other elements or properties after it finds an error.
For each error, it will emit an `error` event, with the error as argument.
After all elements or properties have been checked, the first error found is thrown.

## Reference

### Using `TypeParser`
`TypeParser` is part of the `homebridgelib` package.
To use `TypeParser`, add homebridgelib as a dependency in `package.json`, and `require` it:
```javascript
const homebridgelib = require('homebridgelib') // load homebridgelib skeleton
const TypeParser = homebridgelib.TypeParser // load TypeParser
```
Note that `homebridgelib` uses lazy initialisation, so `TypeParser` (or any other feature) will only be loaded when first referenced.

`TypeParser` uses [`debug`](https://github.com/visionmedia/debug).
To see `TypeParser`'s debug message set the `DEBUG` environment variable to include `TypeParser` before starting `node`.

### `Type`
The class property `TypeParser.Type` defines the base types:

type       | value
---------- | -----------
`any`      | A "real" Javascript value, i.e. not `undefined`, nor `null`.
`boolean`  | A Javascript `boolean`, i.e. `false` or `true`.
`integer`  | A Javascript `number` with an integer value.
`number`   | A Javascript `number` with a finite value, i.e. not `Infinity`, `-Infinity` nor `NaN`.
`string`   | A Javascript `string`.
`host`     | A Javascript `string` holding `"`_hostname_`":`_port_.<br>The value is converted to an `object` with `host` and `port` properties.
`ipv4`     | (_not yet implemented_)<br>A Javascript `string` holding an IPv4 address.<br>The value is converted to an `array` of four `integer`s between 0 and 255.
`ipv6`     | (_not yet implemented_)<br>A Javascript `string` with an IPv6 address.<br>The value is converted to an `array` of eight `integer`s between 0 and 65535 (0x0000 and 0xFFFF).
`path`     | A Javascript `string` with a path as value.<br>The path is converted to an array of elements.
`array`    | A Javascript `Array`.<br>A Javascript `object` constructed by (a subclass of) `Array`.
`object`   | A "real" Javascript `object`.<br>A Javascript `object` constructed by `Object`.
`function` | A "real" Javascript `function`.<br>Defined as a function or lambda, not as a class.
`instance` | A class instance.<br>A Javascript `object` constructed from a class (other than `Object`), through `new `_Class_`()`.
`class`    | A Javascript class.<br>A Javascript `function`, defined through `class `_Class_.

### Validation Modes
- Apply `defaultValue`:
  - On missing key (`undefined`) - only when `mandatory`?
  - On `undefined` (value)
  - On `null`
  - On invalid, not convertible type (instead of `TypeError`)
- Apply `minimumValue`, `maximumValue`, `case`, `maximumLength`
  - On too small, large value or wrong case, too long (instead of `RangeError`)
- Apply type conversion (instead of `TypeError`):
  - `boolean` from `number` or `string`
  - `integer` or `number` from `boolean` or `string`
  - `string` from `boolean` or `number`
  - `string` using `toString()`
  - `array` from `null` or single value

### Nested Types

#### `array`
- Specify `length` to indicate the allowed number of elements;
- Specify `orderedMembers` to indicate allowed types per element.  Strict, non-empty `array` of non-strict, non-empty `array` of `typeDefinition`.
- Specify `members` to indicate allowed types of (remaining) elements.  Non-strict, non-empty array of `typeDefinition`.

#### `object`
- Specify `properties` to indicate named properties.  Non-empty object of key/`typeDefinition`
- Specify `members` to indicate unnamed properties.  Non-strict, non-empty array of `typeDefinition`, with additional `keyPattern` property.

#### `string`
- Specify `separator` to split the string.
- Specify `length` to indicate the allowed number of elements;
- Specify `orderedMembers` to indicate allowed types per element.  Strict, non-empty `array` of non-strict, non-empty `array` of `typeDefinition`.
- Specify `members` to indicate allowed types of (remaining) elements.  Non-strict, non-empty array of `typeDefinition`.

#### `allowedValues`
Non-empty, non-strict `array` of elements that are:
- For `integer` types:
  - `integer`; or
  - strict `array` of two `integer` elements; or
- For `number` types:
  - `number`; or
  - strict `array` of two `number` elements; or
- For `string` types
  - `string`; or
  - `instance` of RegExp

### `length`



Compound types are defined using nested definitions, e.g.:
- To define a list, i.e. a non-empty array of unique, non-empty, lowercase
string values, use:
```javascript
  {
    type: 'array',
    nonEmpty: true,
    members: { type: 'string', nonEmpty: true, case: 'lower' },
    membersUnique: true
  }
```
- To define a non-empty array of non-negative integers and/or non-empty
lowercase strings, use:
```javascript
  {
    type: 'array',
    nonEmpty: true,
    members: [
      { type: 'integer', minimumValue: 0 },
      { type: 'string', nonEmpty: true, case: 'lower' }
    ]
  }
```
- To define an RGB colour, use:
```javascript
  {
    type: 'object',
    properties: {
      red: { type: 'integer', mandatory: true, allowedValues: [[0, 255]] },
      green: { type: 'integer', mandatory: true, allowedValues: [[0, 255]] },
      blue: { type: 'integer', mandatory: true, allowedValues: [[0, 255]] }
    }
  }
```

### Validation


## Value Type Definition



### Keys

#### `allowedValues`
The `allowedValues` property specifies what values are allowed for the value
type being defined.

For an `integer` or `number` value type, `allowedValues` is a _non-strict_ array
of allowed values and/or ranges of allowed values.  A range of allowed values
is a _strict_ array of two allowed values, allowing these two values and any
value in between them.

For instance, take the allowed value for a network port:
- To specify a single port, use: `allowedValues: 51826`.
This allows a single value, `51826`;
- To specify a list of ports, use: `allowedValues: [51826, 51827]`.
This allows two single values, `51827` and `51827`;
- To specify a non-privileged port, use: `allowedValues: [[1025, 65535]]`.
This allows any value from `1025` to `65525`;
- To specify a random port or a non-privileged port, use:
`allowedValues: [0, [1025, 65535]]`.
This allows `0` and any value from `1025` to `65525`.

The definition of `allowedValues` for an `integer` value type is:
```javascript
allowedValues: {
  type: 'array',
  strict: 'false', // Allow a single value to be converted to an array.
  nonEmpty: true,
  members: {
    type: 'array',
    strict: 'false', // Allow a single value to be converted to an array.
    members: [
      { type: 'integer', strict: true },
      { type: 'array', strict: true, length: 2, members: { type: 'integer' }}
    ]
  }
}
```
The definition for a `number` value type is the same, obviously with `number`
replacing `integer`.

For a `string` value type, `allowedValues` is a _non-strict_ array of allowed
values and/or regular expressions for allowed values.

For instance, take the allowed value for a hostname:
- To specify `localhost` or `127.0.0.1`, use:
`allowedValues: ['localhost', '127.0.0.1']`.
This allows two values: `'localhost'`, `'127.0.0.1'`.
- To specify a (non-qualified) hostname,
use `allowedValues: /^[A-Za-z0-9](-?[A-Za-z0-9])*$/`.
This allows any value consisting of letters, digits and hyphens, not starting
or ending with a hyphen.
- To specify an IPv4 address, use:
`allowedValues: /^[0-2]?[0-9]?[0-9](\.[0-2]?[0-9]?[0-9]){3}$/`.
This matches any series of four one- to three-digit numbers separated by a dot,
like `127.0.0.1` or `192.168.1.100` (but doesn't actually check that these
numbers form a valid IP address, e.g. it also allows `299.299.299.299`).
- To allow a hostname and an IPv4 address, use:
`allowedValues: [/^[A-Za-z0-9](-?[A-Za-z0-9])*$/, /^[0-2]?[0-9]?[0-9](\.[0-2]?[0-9]?[0-9]){3}$/]`.

The definition of `allowedValues` for an `string` value type is:
```javascript
allowedValues: {
  type: 'array',
  strict: 'false', // Allow a single value to be converted to an array.
  nonEmpty: true,
  members: {
    type: 'array',
    strict: 'false', // Allow a single value to be converted to an array.
    members: [
      { type: 'string' },
      { type: 'instance', Class: RegExp }
    ]
  }
}
```

### `case`


#### Meta Properties
```javascript
{
  type: 'object',
  strict: true,
  properties: {
    type: {
      type: 'string',
      mandatory: true,
      allowedValues: [
        'any', 'boolean', 'integer', 'number', 'string', 'host', 'path',
        'array', 'object', 'function', 'instance', 'class'
      ]
    },
    mandatory: { type: 'boolean' },
    strict: { type: 'boolean' },
    allowedValues: {
      type: 'array',
      strict: false,
      nonEmpty: true,
      members: [
        { type: 'any' },
        { type: 'array', length: 2, members: 'any' }
      ]
    },
    members: {

    }
    length: {
      type: 'array',
      strict: false,
      membersUnique: true,
      members: [
        {
          type: 'number',
          minimumValue: 0
        },
        {
          type: 'array',
          length: 2,
          members: { type: 'integer', minimumValue: 0 }
        }
      ]
    }

    ]
    defaultValue: { type: 'any' },
    minimumValue: { type: 'number' },
    maximumValue: { type: 'number' },
    nonEmpty: { type: 'boolean' },
    case: { type: 'string', allowedValues: ['lower', 'upper'] },
    absolute: { type: 'boolean' },
    asString: { type: 'boolean' },
    membersNonEmpty: { type: 'boolean' },
    membersType: {
      type: 'enum',
      enumValues: Object.keys(TypeParser.TypeParser) },
    membersUnique: { type: 'boolean' },
    Class: { type: 'class', strict: false }
 }
}
```

- To define a non-empty object with variable keys, each with a non-negative
integer value, use:
```javascript
  {
    type: 'object',
    nonEmpty: true,
    members: { type: 'integer', mandatory: true, minimumValue: 0 }
  }
```
- To define an array of objects, each identified by a key property `id`, use:
```javascript
  {
    type: 'array',
    members: {
      type 'object',
      properties: {
        id: { type 'string', mandatory: true, nonEmpty: true, case: 'lower' },
        value: { type: 'integer', mandatory: true, minimumValue: 0 }
      }
    },
    membersKey: 'id'
  }
```

#### `ipv4`
```javascript
{
  type: 'string',

}
```

#### `host`
```javascript
{
  type: 'string',
  separator: ':',
  length: 2,
  orderedMembers: [
    {
      hostname: {
        type: 'string',
        allowedValues: [
          TypeParser.Pattern.fqdn,
          TypeParser.Pattern.ipv4
        ]
      }
    },
    {
      port: {
        type: 'integer',
        strict: false, // do conversion, but no min/max
        allowedValues: [0, [1025, 65535]]
      }
    }
  ]
  properties: { // how to indicate order?
    hostname: { // first property
      allowedTypes: [
        { // fqdn
          type: 'string',
          separator: '.'
          nonEmpty: true
          asString: true,
          members: [
            {
              type: 'string',
              allowedValues: [/^[a-zA-Z](:?[a-zA-Z0-9-]*[a-zA-Z0-9])*$/]
            }
          ]
        },
        { // ipv4
          type: 'string',
          separator: '.'
          length: [4]
          asString: true
          members: [
            {
              type: 'integer',
              strict: false, // do conversion, but no min/max
              allowedValues: [[0, 255]]
            }
          ]
        }
      ]
    },
    port: { // second property
      type: 'integer',
      strict: false, // do conversion, but no min/max
      allowedValues: [0, [1025, 65535]]
    }
  }
}
```

#### `config.json`
```javascript
{
  type: 'object',
  strict: true,
  properties: {
    bridge: {
      type: 'object',
      mandatory: true,
      strict: true,
      properties: {
        name: {
          type: 'string',
          nonEmpty: true,
          defaultValue: 'Homebridge'
        },
        username: {
          type: 'string',
          mandatory: true,
          // separator: ':',
          // length: 6,
          // members: {
          //   type: 'string',
          //   allowedValues: /^[0-9A-F]{2}$/
          // }
          // asString: true
          allowedValues: /^[0-9A-F]{2}(:?:[0-9A-F]{2}){5}$/
        },
        port: {
          type: 'integer',
          allowedValues: [0, [1025, 65535]],
          defaultValue: 0
        },
        pin: {
          type: 'string',
          allowedValues: /^[0-9]{3}-[0-9]{2}-[0-9]{3}$/,
          defaultValue: '031-45-154'
        }
      }
    },
    description: {
      type: 'string',
      strict: true
    },
    mdns: {
      type: 'object',
      strict: true,
      properties: {
        interface: {
          type: 'string',
          // separator: '.',
          // length: 4,
          // members: {
          //   type: 'string',
          //   allowedValues: /^\d{1,2}|[01]\d{2}|2[0-4]\d|25[0-5]$/
          // },
          // asString: true,
          allowedValues: TypeParser.Pattern.ipv4
        }
      }
    },
    plugins: {
      type: 'array',
      strict: true,
      members: { type: 'string', allowedValues: /^homebridge-.*$/, strict: true }
    },
    platforms: {
      type: 'array',
      strict: true,
      members: {
        type: 'object',
        properties: {
          platform: { type: 'string', mandatory: true, nonEmpty: true },
          name: { type: 'string', nonEmpty: true },
          otherKeys: { type: 'any' }
        }
      },
      membersKey: 'platform'
    },
    accessories: {
      type: 'array',
      strict: true,
      members: {
        type: 'object',
        properties: {
          accessory: { type: 'string', mandatory: true, nonEmpty: true },
          name: { type: 'string', nonEmpty: true },
          otherKeys: { type: 'any' }
        }
      },
      membersKey: 'accessory'
    }
  }
}
```
