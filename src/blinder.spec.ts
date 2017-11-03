#!/usr/bin/env ts-node

// tslint:disable:no-shadowed-variable
import * as test  from 'blue-tape'
// import * as sinon from 'sinon'
// const sinonTest   = require('sinon-test')(sinon)

import blinder  from './blinder'

test('blinder', async t => {
  t.ok(blinder.version(), 'should init blinder')
  await blinder.quit()
})
