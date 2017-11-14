import * as path  from 'path'

import {
  FaceBlinder,
  // log as blinderLog,
}                 from 'face-blinder'
import finis      from 'finis'

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

let FINIS_QUITING = false
finis(async (code, signal, error) => {
  if (FINIS_QUITING) {
    return
  }
  FINIS_QUITING = true
  log.verbose('Blinder', `finis(${code}, ${signal}, ${error})`)
  await blinder.quit()
})

log.info('FaceBlinder', `v${blinder.version()}`)

blinder.updateEmbeddingStore()

export default blinder
