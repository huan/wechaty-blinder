import * as path  from 'path'
import {
  log,
}                 from './config'

import blinder    from './blinder'
import wechaty    from './wechaty'

export class Bot {

  constructor() {
    log.verbose('Bot', 'constructor()')
  }

  public async run(): Promise<void> {
    log.verbose('Bot', 'run()')

    wechaty
    .on('scan',     path.resolve(__dirname, './listeners/scan'))
    .on('logout',   path.resolve(__dirname, './listeners/logout'))
    .on('error',    path.resolve(__dirname, './listeners/error'))
    .on('login',    path.resolve(__dirname, './listeners/login'))
    .on('message',  path.resolve(__dirname, './listeners/message'))

    log.info('Bot', 'run() blinder is initializing... please wait(20-200s)...')
    await blinder.init()
    log.info('Bot', 'run() blinder initialized')

    await wechaty.init()

    await new Promise<void>((resolve, reject) => {
      wechaty.on('logout', () => resolve())
      wechaty.on('error', reject)
    })
  }

  public async quit(): Promise<void> {
    await wechaty.quit()
  }
}
