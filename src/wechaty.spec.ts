#!/usr/bin/env ts-node

// tslint:disable:no-shadowed-variable
import * as test  from 'blue-tape'
// import * as sinon from 'sinon'
// const sinonTest   = require('sinon-test')(sinon)

import wechaty  from './wechaty'

test('wechaty', async t => {
  t.ok(wechaty.version(), 'should init wechaty')
})
