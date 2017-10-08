import {
  FaceBlinder,
}                 from 'face-blinder'
const finis  = require('finis')

export const blinder = new FaceBlinder()

finis((code, signal, error) => {
  blinder.quit()
  console.log(`finis(${code}, ${signal}, ${error})`)
})

export default blinder
