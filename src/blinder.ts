import * as path  from 'path'

import {
  FaceBlinder,
}                 from 'face-blinder'
const finis       = require('finis')

import {
  log,
  WORKDIR,
}                 from './config'

const workdir = path.join(
  WORKDIR,
  'face-blinder',
)
export const blinder = new FaceBlinder({
  workdir,
})

finis(async (code, signal, error) => {
  await blinder.quit()
  log.verbose('Blinder', `finis(${code}, ${signal}, ${error})`)
})

export default blinder
