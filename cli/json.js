#!/usr/bin/env node

// homebridge-lib/cli/json.js
//
// Library for Homebridge plugins.
// Copyright © 2018-2024 Erik Baauw. All rights reserved.
//
// JSON formatter.

import { JsonTool } from 'hb-lib-tools'

new JsonTool(import.meta.dirname).main()
