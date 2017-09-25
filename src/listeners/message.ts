import * as fs    from 'fs'
import * as path  from 'path'

import {
  Contact,
  MediaMessage,
  Message,
  MsgType,
  Wechaty,
}                   from 'wechaty'
import {
  path as APP_ROOT,
}                   from 'app-root-path'

import {
  log,
}               from '../config'
import blinder  from '../blinder'

export = async function (message: Message | MediaMessage) {
  const room    = message.room()
  // const sender  = message.from()
  const content = message.content()

  log.info('Bot', 'bindMessage() on(message) %s', content)

  if (!room) {
    return
  }

  const topic = room.topic()

  if (!/facenet/i.test(topic)) {
    return
  }

  if (message instanceof MediaMessage) {
    if (message.type() !== MsgType.IMAGE) {
      return
    }

    const fullpath = await savePhoto(message)
    const faceList = await blinder.see(fullpath)

    if (!faceList.length) {
      log.verbose('Bot', 'no face found from blinder.see()')
      return
    }

    const similarFaceList = await blinder.similar(faceList[0])
    if (!similarFaceList.length) {
      log.verbose('Bot', 'no face found from blinder.similar()')
      return
    }

    const faceFile = blinder.file(similarFaceList[0])
    await message.say(new MediaMessage(faceFile))
    await Wechaty.sleep(500)
    // await message.say(faceFile)
    // await Wechaty.sleep(500)

    // for (const face of faceList) {
    //   const similarFaceList = await blinder.similar(face)

      // for (const similarFace of similarFaceList) {
      //   const faceFile = blinder.file(similarFace)
      //   await message.say(new MediaMessage(faceFile))
      //   await message.say(faceFile)
      // }
    // }

  } else {
    if (/^learn$/i.test(content)) {
      for (const contact of room.memberList()) {
        const file = await avatarFile(contact)
        const name = contact.name()
        const faceList = await blinder.see(file)
        for (const face of faceList) {
          await blinder.remember(face, name)
        }
      }
      await message.say('learn #' + room.memberList().length + ' contacts in room')
      await Wechaty.sleep(500)
    }
  }
}

async function savePhoto(message: MediaMessage): Promise<string> {
  const filename = path.join(
    APP_ROOT,
    'data',
    message.filename(),
  )
  console.log('IMAGE local filename: ' + filename)

  const fileStream = fs.createWriteStream(filename)

  console.log('start to readyStream()')
  try {
    const netStream = await message.readyStream()
    return new Promise<string>(resolve => {
      fileStream.once('close', _ => {
        console.log('finish pipe stream')
        const stat = fs.statSync(filename)
        console.log('file ', filename, ' size: ', stat.size)
        resolve(filename)
      })

      netStream
      .pipe(fileStream)
    })
  } catch (e) {
    console.error('stream error:', e)
    throw e
  }

}

async function avatarFile(contact: Contact): Promise<string> {
  const name = contact.name()
  const avatarFileName = `${APP_ROOT}/data/${name}.jpg`

  const avatarReadStream = await contact.avatar()
  const avatarWriteStream = fs.createWriteStream(avatarFileName)

  return new Promise<string>((resolve, reject) => {
    avatarWriteStream.on('close', () => resolve(avatarFileName))
    avatarWriteStream.on('error', reject)
    avatarReadStream.pipe(avatarWriteStream)
  })
}
