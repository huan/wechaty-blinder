import {
  log,
}                 from './config'

import blinder    from './blinder'
import wechaty    from './wechaty'

export class Brain {

  constructor() {
    log.verbose('Brain', 'constructor()')
  }

  public async start(): Promise<void> {
    log.verbose('Brain', 'run()')

    wechaty
    .on('scan',     './listeners/scan')
    .on('logout',   './listeners/logout')
    .on('error',    './listeners/error')
    .on('login',    './listeners/login')
    .on('message',  './listeners/message')

    log.info('Brain', 'run() blinder is initializing... please wait... (about 20 to 200 seconds)')
    await blinder.init()
    log.info('Brain', 'run() blinder initialized')

    await wechaty.init()

    await new Promise<void>((resolve, reject) => {
      wechaty.on('logout', () => resolve())
      wechaty.on('error', reject)
    })
  }

  public async stop(): Promise<void> {
    await wechaty.quit()
  }
}
