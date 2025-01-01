#!/usr/bin/env node

// homebridge-lib/cli/upnp.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2025 Erik Baauw. All rights reserved.
//
// Logger for UPnP device announcements.

import { createRequire } from 'node:module'

import { UpnpTool } from 'hb-lib-tools/UpnpTool'

const require = createRequire(import.meta.url)
const packageJson = require('../package.json')

new UpnpTool(packageJson).main()
