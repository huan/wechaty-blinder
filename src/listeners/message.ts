import * as fs    from 'fs'
import * as path  from 'path'

import {
  path as APP_ROOT,
}                   from 'app-root-path'
import {
  Contact,
  MediaMessage,
  Message,
  MsgType,
  Room,
  Wechaty,
}                   from 'wechaty'
import {
  createCanvas,
  Face,
  resizeImage,
  saveImage,
}                   from 'face-blinder'

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
    if (/^#\w{3,}/i.test(content)) {
      const regex = /^#(\w{3,})\s*([^\n]*)$/
      const matches = regex.exec(content)
      // console.log(matches)
      if (matches) {
        switch (matches[1].toLowerCase()) {
          case 'name':
            await commandName(matches[2], message)
            break
          case 'learn':
            onRoomLearnMessage.call(this, room, message)
            break
          default:
            log.verbose('Listener', '(message) onRoomMessage(%s) unsupported command: %s', content, matches[0])
            break
        }
      }
    }
  }
}

/**
 * #name 432432 李卓桓
 * #name 432423
 */
async function commandName(arg: string, message: Message): Promise<void> {
  log.verbose('Listener', '(message) commandName(%s)', arg)

  const [md5Partial, ...secondList] = arg.split(' ')
  const name = secondList.join(' ')

  const md5List = await blinder.list(md5Partial)
  if (md5List.length === 0) {
    message.say('no such md5')
  } else if (md5List.length === 1) {
    const md5 = md5List[0]
    const face = await blinder.face(md5)
    if (!face) {
      throw new Error('no face')
    }
    if (name) {
      await blinder.remember(face, name)
      message.say('face ' + md5 + ' set name to ' + name)
    } else {
      const savedName = await blinder.remember(face)
      message.say('face ' + md5 + ' name is ' + savedName)
    }
  } else {
    const roger = [
      `which md5 do you want?`,
      ...md5List,
    ].join('\n')
    message.say(roger)
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
    if (i > 10) {
      break
    }
    // await message.say(`Similar faces of ${faceList[i].md5}:`)
    // await Wechaty.sleep(1000)

    const similarFaceList = await blinder.similar(faceList[i])
    if (!similarFaceList.length) {
      log.verbose('Listener', '(message) onImage() no face found from blinder.similar()')
      continue
    }

    const filePath = path.join(
      workDirectory(),
      (Math.random() + Math.random()).toString(36).substr(2) + '.png',
    )

    await collages([faceList[i], ...similarFaceList], filePath)

    await message.say(new MediaMessage(filePath))
    await Wechaty.sleep(1000)

    // for (let j = 0; j < similarFaceList.length; j++) {
    //   if (j > 1) {
    //     break
    //   }
    //   const faceFile = blinder.file(similarFaceList[j])
    //   await message.say(new MediaMessage(faceFile))

    //   const confidence = (similarFaceList[j].confidence || 0).toFixed(2)
    //   const distance   = faceList[i].distance(similarFaceList[j]).toFixed(2)

    //   const roger = [
    //     '^',
    //     `Confidence: ${confidence}`,
    //     `Distance: ${distance}`,
    //   ].join('\n')

    //   await message.say(roger)
    //   await Wechaty.sleep(500)
    // }
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
    workDirectory(),
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
    workDirectory(),
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

function workDirectory() {
  const workdir = path.join(
    APP_ROOT,
    'workdir',
  )
  if (!fs.existsSync(workdir)) {
    fs.mkdirSync(workdir)
  }
  return workdir
}

async function collages(faceList: Face[], file: string): Promise<void> {
  const SIZE    = 160
  const PADDING = 20

  const profileFace = faceList.shift()
  if (!profileFace) {
    throw new Error('should return a blank picture for no face')
  }

  const width = SIZE * 3
  const height = (SIZE + PADDING) * (1 + Math.ceil((faceList.length - 1) / 3))

  /**
   * Init Canvas
   */
  const canvas = createCanvas(width, height)
  const ctx    = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('getContext found null')
  }
  ctx.fillStyle = '#ddd'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  /**
   * Profile Face
   */
  let imageData = profileFace.imageData
  if (imageData.width !== SIZE) {
    imageData = await resizeImage(imageData, SIZE, SIZE)
  }
  ctx.putImageData(imageData, 0, 0)

  const recognizedName = await blinder.recognize(profileFace) || '不认识'

  ctx.font         = 'bold 48px sans-serif'
  ctx.fillStyle    = '#333'
  ctx.strokeStyle  = '#333'
  ctx.textBaseline = 'middle'
  ctx.fillText(recognizedName, SIZE + 10, SIZE / 2)

  let id = profileFace.md5.substr(0, 5)
  let name = await blinder.remember(profileFace) || ''
  ctx.font         = '12px sans-serif'
  ctx.fillStyle    = '#333'
  ctx.textBaseline = 'middle'
  ctx.fillText(
    `${id} / ${name}`,
    10,
    SIZE + PADDING / 2,
  )

  /**
   * Other Faces
   */
  let row, col
  for (let i = 0; i < faceList.length; i++) {
    row = Math.floor(i / 3)
    col = i % 3

    const face = faceList[i]
    imageData = face.imageData
    if (imageData.width !== SIZE) {
      imageData = await resizeImage(imageData, SIZE, SIZE)
    }
    ctx.putImageData(
      imageData,
      col * SIZE,
      (row + 1) * (SIZE + PADDING),
    )

    id = face.md5.substr(0, 5)
    const dist = profileFace.distance(face).toFixed(2)
    name = await blinder.remember(face) || ''

    ctx.font         = '12px sans-serif'
    ctx.fillStyle    = '#333'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      `${id} / ${dist} / ${name}`,
      col * SIZE + 10,
      (row + 1 + 1) * (SIZE + PADDING) - PADDING / 2,
    )
  }

  imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  await saveImage(imageData, file)
}