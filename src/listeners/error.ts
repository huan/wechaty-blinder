import {
  log,
}         from '../config'

export = function (error: Error) {
  log.error('Error', error)
}
