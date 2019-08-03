#!/usr/bin/env node

// homebridge-lib/cli/upnp.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2019 Erik Baauw. All rights reserved.
//
// Logger for UPnP device announcements.

'use strict'

const homebridgeLib = require('../index')

new homebridgeLib.UpnpCommand().main()
