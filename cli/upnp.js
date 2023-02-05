#!/usr/bin/env node

// homebridge-lib/cli/upnp.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2023 Erik Baauw. All rights reserved.
//
// Logger for UPnP device announcements.

'use strict'

const { UpnpTool } = require('hb-lib-tools')

new UpnpTool(require('../package.json')).main()
