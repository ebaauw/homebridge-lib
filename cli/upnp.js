#!/usr/bin/env node

// homebridge-lib/cli/upnp.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2024 Erik Baauw. All rights reserved.
//
// Logger for UPnP device announcements.

import { UpnpTool } from 'hb-lib-tools'

new UpnpTool(import.meta.dirname).main()
