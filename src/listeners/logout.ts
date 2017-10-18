import {
  Contact,
}           from 'wechaty'
import {
  log,
}           from '../config'

export = function (user: Contact) {
  log.info('Bot', `${user} logouted`)
}
