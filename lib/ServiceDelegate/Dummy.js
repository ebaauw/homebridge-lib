// homebridge-lib/lib/ServiceDelegate/Dummy.js
//
// Library for Homebridge plugins.
// Copyright © 2017-2022 Erik Baauw. All rights reserved.

'use strict'

const homebridgeLib = require('../../index')

const { ServiceDelegate } = homebridgeLib

/** Class for a delegate for a dummy _StatelessProgrammableSwitch_ service.
  *
  * This delegate sets up a dummy `Services.hap.StatelessProgrammableSwitch`
  * HomeKit service with the following HomeKit characteristics:
  *
  * key                       | Characteristic                                | isOptional
  * ------------------------- | --------------------------------------------- | ----------
  * `name`                    | `Characteristics.hap.Name`                    |
  * `programmableSwitchEvent` | `Characteristics.hap.ProgrammableSwitchEvent` |
  *
  * Including the dummy service prevents Home from showing a _Not Supported_
  * tile, and causes Home on iOS14 to show the _Favorite_ setting.
  * @extends ServiceDelegate
  * @memberof ServiceDelegate
  */
class Dummy extends ServiceDelegate {
  constructor (accessoryDelegate, params = {}) {
    params.name = accessoryDelegate.name
    params.Service = accessoryDelegate.Services.hap.StatelessProgrammableSwitch
    super(accessoryDelegate, params)

    this.addCharacteristicDelegate({
      key: 'programmableSwitchEvent',
      Characteristic: this.Characteristics.hap.ProgrammableSwitchEvent,
      props: {
        minValue: this.Characteristics.hap.ProgrammableSwitchEvent.SINGLE_PRESS,
        maxValue: this.Characteristics.hap.ProgrammableSwitchEvent.SINGLE_PRESS
      }
    })

    accessoryDelegate.propertyDelegate('name')
      .on('didSet', (value) => {
        this.values.configuredName = value
      })
  }
}

module.exports = Dummy
