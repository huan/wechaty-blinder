import * as path from 'path'

import finis  from 'finis'

import {
  config,
  IoClient,
  Room,
  // log as wechatyLog,
  Wechaty,
}             from 'wechaty'

import {
  FACENET_SECRET,
  log,
  WORKDIR,
}             from './config'

// wechatyLog.level(log.level())

const profile = path.join(WORKDIR, 'wechaty-blinder')

export const wechaty = Wechaty.instance({
  profile,
})

const token = config.token
if (token) {
  log.info('Wechaty', 'TOKEN: %s', token)
  const client = new IoClient({
    token,
    wechaty,
  })

  client.init().catch(e => {
    log.error('Wechaty', 'IoClient.init() exception: %s', e)
    wechaty.emit('error', e)
  })
} else {
  log.verbose('Wechaty', 'TOKEN: N/A')
}

export async function announce(text: string): Promise<void> {
  log.info('Wechaty', 'announce(%s)', text)

  const topic    = new RegExp(FACENET_SECRET, 'i')
  let   roomList = await Room.findAll({ topic })
  log.verbose('Wechaty', 'announce() got %d rooms', roomList.length)

  if (!roomList.length) {
    log.verbose('Wechaty', 'announce() to self because no room found')
    await wechaty.say(text)
    return
  }

  if (roomList.length > 3) {
    roomList = roomList.slice(0, 3)
  }

  for (const room of roomList) {
    log.verbose('Wechaty', 'announce() to %s', room)
    await room.say(text)
  }
}

let FINIS_QUITING = false
finis(async (code, signal) => {
  if (FINIS_QUITING) {
    log.warn('Wechaty', 'finis(%s, %s) called again when quiting... NOP', code, signal)
    return
  }
  FINIS_QUITING = true
  log.info('Wechaty', 'finis(%s, %s)', code, signal)

  const exitMsg = `Der! I'm going to offline now, see you!`
  if (wechaty.logonoff()) {
    log.info('Wechaty', 'finis() announce exiting')
    try {
      await announce(exitMsg)
    } catch (e) {
      log.error('Wechaty', 'announce() exception: %s', e)
    }
  } else {
    log.info('Wechaty', 'finis() bot had been already stopped')
  }
  setTimeout(async () => {
    try {
      log.info('Wechaty', 'finis() setTimeout() going to exit with %d', code)
      if (wechaty.logonoff()) {
        await wechaty.stop()
      }
    } catch (e) {
      log.error('Wechaty', 'finis() setTimeout() exception: %s', e)
    } finally {
      process.exit(code)
    }
  }, 5 * 1000)
})

log.info('Wechaty', `v${wechaty.version()}`)

export * from 'wechaty'
export default wechaty
