import {
  Contact,
}           from 'wechaty'

import {
  log,
}           from '../config'

export = async function(user: Contact) {
  const msg = `${user.name()} logined`

  log.info('Bot', msg)
  await this.say(msg)
}
