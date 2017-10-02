import * as fs    from 'fs'
import * as path  from 'path'

import {
  Contact,
  MediaMessage,
  Message,
  MsgType,
  Room,
  Wechaty,
}                   from 'wechaty'
import {
  path as APP_ROOT,
}                   from 'app-root-path'

import {
  log,
}               from '../config'
import blinder  from '../blinder'

export = async function (
  this    : Wechaty,
  message : Message | MediaMessage,
): Promise<void> {
  const room    = message.room()
  const sender  = message.from()
  const content = message.content()
  log.info('Listener', '(message) %s%s:"%s"',
                        sender,
                        room ? `@[${room.topic()}]` : '',
                        content,
          )

  if (room) {
    try {
      await onRoomMessage.call(this, room, message)
    } catch (e) {
      console.error(e)
    }
  }

}

async function onRoomMessage(
  this    : Wechaty,
  room    : Room,
  message : Message | MediaMessage,
): Promise<void> {
  if (message instanceof MediaMessage) {
    return onMediaMessage.call(this, room, message)
  } else {  // message instance of Message
    const content = message.content()
    if (/^learn$/i.test(content)) {
      return onRoomLearnMessage.call(this, room, message)
    }
  }
}

async function onMediaMessage(
  this    : Wechaty,
  room    : Room,
  message : MediaMessage,
): Promise<void> {
  const topic = room.topic()
  if (  /facenet/i.test(topic)
      && message.type() === MsgType.IMAGE
      && !message.self()
  ) {
    const absFilePath = await mediaFile(message)
    await onImage.call(this, absFilePath, message)
  }
}

async function onImage(
  this        : Wechaty,
  absFilePath : string,
  message     : MediaMessage,
): Promise<void> {
  const faceList = await blinder.see(absFilePath)

  if (!faceList.length) {
    log.verbose('Bot', 'no face found from blinder.see()')
    return
  }

  for (let i = 0; i < faceList.length; i++) {
    if (i > 1) {
      break
    }
    await message.say(`Similar faces of ${faceList[i].md5}:`)
    await Wechaty.sleep(500)

    const similarFaceList = await blinder.similar(faceList[i])
    if (!similarFaceList.length) {
      log.verbose('Listener', '(message) onImage() no face found from blinder.similar()')
      continue
    }

    for (let j = 0; j < similarFaceList.length; j++) {
      if (j > 1) {
        break
      }
      const faceFile = blinder.file(similarFaceList[j])
      await message.say(new MediaMessage(faceFile))

      const confidence = (similarFaceList[j].confidence || 0).toFixed(2)
      const distance   = faceList[i].distance(similarFaceList[j]).toFixed(2)

      const roger = [
        '^',
        `Confidence: ${confidence}`,
        `Distance: ${distance}`,
      ].join('\n')

      await message.say(roger)
      await Wechaty.sleep(500)
      // await message.say(faceFile)
    }
  }
}

async function onRoomLearnMessage(
  this    : Wechaty,
  room    : Room,
  message : Message,
): Promise<void> {
  for (const contact of room.memberList()) {
    const file = await avatarFile(contact)
    const name = contact.name()
    const faceList = await blinder.see(file)
    for (const face of faceList) {
      await blinder.remember(face, name)
    }
  }
  const roger = `learned # ${room.memberList().length} contacts in room ${room.topic()}`
  await this.say(roger)
  // FIXME: use a queue
  await Wechaty.sleep(500)
}

async function mediaFile(message: MediaMessage): Promise<string> {
  log.verbose('Listener', '(message) mediaFile(%s)', message.filename())

  const filePath = path.join(
    dataDirectory(),
    message.filename(),
  )
  log.silly('Listener', '(message) mediaFile() ' + filePath)

  try {
    const netStream = await message.readyStream()
    await saveStream(netStream, filePath)
  } catch (e) {
    console.error('stream error:', e)
    throw e
  }
  return filePath
}

async function avatarFile(contact: Contact): Promise<string> {
  const name = contact.name()
  log.verbose('Listener', '(message) avatarFile(%s)', name)

  const filePath = path.join(
    dataDirectory(),
    `${name}.jpg`,
  )
  const avatarReadStream = await contact.avatar()
  await saveStream(avatarReadStream, filePath)
  return filePath
}

async function saveStream(stream: NodeJS.ReadableStream, file: string, options?: string | {
  flags?     : string | undefined,
  encoding?  : string | undefined,
  fd?        : number | undefined,
  mode?      : number | undefined,
  autoClose? : boolean | undefined,
  start?     : number | undefined,
} | undefined) : Promise<void> {
  log.verbose('Listener', '(message) saveStream(_, %s)', file)

  options = Object.assign({}, options)
  const writeStream = fs.createWriteStream(file, options)

  return new Promise<void>((resolve, reject) => {
    writeStream.once('close', () => {
      try {
        if (fs.statSync(file).size > 0) {
          return resolve()
        }
      } catch (e) {
        return reject(e)
      }
      return reject(new Error(`zero size file(${file}) found!`))
    })
    writeStream.once('error', reject)
    stream.once('error', reject)
    stream.pipe(writeStream)
  })
}

function dataDirectory() {
  const dataDir = path.join(
    APP_ROOT,
    'data',
  )
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir)
  }
  return dataDir
}
