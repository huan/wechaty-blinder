import * as path  from 'path'

import {
  FaceBlinder,
  // log as blinderLog,
}                 from 'face-blinder'
const finis       = require('finis')

import {
  log,
  WORKDIR,
}                 from './config'

// blinderLog.level(log.level())

const workdir = path.join(
  WORKDIR,
  'face-blinder',
)
const minSize = 160

export const blinder = new FaceBlinder({
  minSize,
  workdir,
})

finis(async (code, signal, error) => {
  await blinder.quit()
  log.verbose('Blinder', `finis(${code}, ${signal}, ${error})`)
})

log.info('FaceBlinder', `v${blinder.version()}`)

export default blinder
