import {
  Contact,
  Sayable,
}           from 'wechaty'

import {
  log,
}           from '../config'

export = async function(this: Sayable, user: Contact) {
  const msg = `${user.name()} logined`

  log.info('Bot', msg)
  await user.say(msg)
}
