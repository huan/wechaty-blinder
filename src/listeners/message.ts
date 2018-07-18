import * as fs    from 'fs'
import * as path  from 'path'

import { FileBox } from 'file-box'

import {
  Contact,
  Message,
  Room,
  Wechaty,
}                   from 'wechaty'
import {
  createCanvas,
  Face,
  loadImage,
  imageToData,
  resizeImage,
  saveImage,
}                   from 'face-blinder'

import {
  FACENET_SECRET,
  GITHUB_URL_QRCODE,
  IMAGEDIR,
  log,
}               from '../config'
import blinder  from '../blinder'

class Heater {
  private lastHeatTime = -1

  constructor(
    public coolingDownTime = 60 * 1000,
  ) {
    log.verbose('Heater', 'constructor(%d)', coolingDownTime)
  }

  public heat(): void {
    log.verbose('Heater', 'heat()')
    this.lastHeatTime = Date.now()
  }

  public overheat(): boolean {
    const duration = Date.now() - this.lastHeatTime
    const tooHot = duration < this.coolingDownTime
    log.verbose('Heater', 'overheat() -> %s', tooHot)
    return tooHot
  }
}

const heater = new Heater(10 * 1000)

export async function onMessage(
  this    : Wechaty,
  message : Message,
): Promise<void> {

  const room    = message.room()
  // const sender  = message.from()

  // log.info('Listener', '(message) %s%s:%s',
  //                       sender,
  //                       room ? room : '',
  //                       message,
  //         )

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
  message : Message,
): Promise<void> {
  log.silly('Listener', '(message) onRoomMessage(%s, %s)', room, message)
  // console.log(message instanceof MediaMessage)
  if (   message.type() !== this.Message.Type.Text
      && message.type() !== this.Message.Type.Unknown
  ) {
    // console.log('???')
    return onMediaMessage.call(this, room, message)
  } else {  // message instance of Message
    const content = message.content()
    if (/^[#/]\w{3,}/i.test(content)) {
      const regex = /^[#/](\w{3,})\s*([^\n]*)$/
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
    const question = [
      `which md5 do you want?`,
      ...md5List.map(md5 => md5.substr(0, 7)),
    ].join('\n')
    message.say(question)
  }
}

async function onMediaMessage(
  this    : Wechaty,
  room    : Room,
  message : Message,
): Promise<void> {
  const topic = await room.topic()
  log.verbose('Listener', '(message) onMediaMessage(%s, %s)', topic, message)

  const topicMatchSecret = new RegExp(FACENET_SECRET, 'i')

  if (
      topicMatchSecret.test(topic)
    // topic.includes(FACENET_SECRET)
    && message.type() === this.Message.Type.Image
  ) {
    if (message.self() && heater.overheat()) {
      return
    }
    const absFilePath = await mediaFile(await message.toFileBox())
    await onImage.call(this, absFilePath, message)
  }
}

async function onImage(
  this        : Wechaty,
  absFilePath : string,
  message     : Message,
): Promise<void> {
  log.verbose('Listener', '(message) onImage(%s, %s)', absFilePath, message)

  const room = message.room() as Room
  const user = message.from()

  if (!user) {
    log.verbose('Bot', 'no from user found from message')
    return
  }

  const faceList = await blinder.see(absFilePath)

  if (!faceList.length) {
    log.verbose('Bot', 'no face found from blinder.see()')
    room.say(`Sorry, I can not see any faces. Please make sure that the face in your photo is big enough(160x160 or bigger for the face).`, user)
    return
  }

  log.verbose('Listener', '(message) onImage() blinder.see() got %d faces', faceList.length)

  for (let i = 0; i < faceList.length; i++) {
    if (i > 5) {
      break
    }
    // await message.say(`Similar faces of ${faceList[i].md5}:`)
    // await Wechaty.sleep(1000)

    const similarFaceList = await blinder.similar(faceList[i])
    if (!similarFaceList.length) {
      log.verbose('Listener', '(message) onImage() no face found from blinder.similar()')
      room.say(`It seems that I do not know this people before. Please give me more photos of that person and I can remember him/her!`, user)
      continue
    }

    const filePath = path.join(
      IMAGEDIR,
      'collages-' + (Math.random() + Math.random()).toString(36).substr(2) + '.png',
    )

    await collages([faceList[i], ...similarFaceList], filePath)
    log.info('Listener', '(message) collages(%s) done.', filePath)

    heater.heat()
    await message.say(FileBox.fromFile(filePath))
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
  log.verbose('Listener', '(message) onRoomLearnMessage(%s)', room)

  const from = message.from()

  if (!from) {
    log.verbose('Bot', 'onRoomLearnMessage() no from user found from message')
    return
  }

  await room.say(
    `Cha! Start learning profile photos from all the members in this room.`,
    from,
  )

  let faceNum = 0

  const memberList = await room.memberList()
  for (const contact of memberList) {
    try {
      await contact.refresh()
      const file = await avatarFile(contact)
      const name = contact.name()
      const faceList = await blinder.see(file)
      faceNum += faceList.length
      for (const face of faceList) {
        await blinder.remember(face, name)
      }
    } catch (e) {
      log.warn('Listener', '(message) onRoomLearnMessage(%s) contact %s get avatar fail: %s',
                            room,
                            contact,
                            e,
                )
    }
  }
  await room.say(
    `Der! I had finished learning ${faceNum} faces from ${memberList.length} profile photos in this room.`,
    from,
  )
  // FIXME: use a DelayQueue from rx-queue
  await Wechaty.sleep(500)
}

async function mediaFile(filebox: FileBox): Promise<string> {
  log.verbose('Listener', '(message) mediaFile(%s)', filebox.name)

  const filePath = path.join(
    IMAGEDIR,
    'media-message-' + filebox.name,
  )
  log.silly('Listener', '(message) mediaFile() ' + filePath)

  try {
    await filebox.toFile(filePath)
  } catch (e) {
    console.error('stream error:', e)
    throw e
  }
  return filePath
}

async function avatarFile(contact: Contact): Promise<string> {
  let name = contact.name() || 'BLINDER-NONAME'
  name = name.replace(path.sep, '-')

  log.verbose('Listener', '(message) avatarFile(%s)', name)

  const filePath = path.join(
    IMAGEDIR,
    `avatar-${name}.jpg`,
  )
  const filebox = await contact.avatar()
  await filebox.toFile(filePath)
  return filePath
}

async function collages(faceList: Face[], file: string): Promise<void> {
  log.verbose('Listener', '(message) collages(faceList.length=%d, %s)',
                          faceList.length, file)
  const SIZE    = 160
  const PADDING = 20
  const MAX_FACE_NUM = 6

  const profileFace = faceList.shift()
  if (!profileFace) {
    throw new Error('should return a blank picture for no face')
  }

  if (faceList.length > MAX_FACE_NUM) {
    faceList = faceList.slice(0, MAX_FACE_NUM)
  }

  const width = SIZE * 3
  const height = (SIZE + PADDING) * (1 + Math.ceil(faceList.length / 3) + 1) - PADDING
  // const height = (SIZE + PADDING) * 4 // 1 row for profile + 2 row for face + 1 row for qrcode

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

  // Header
  // ctx.fillStyle = '#eee'
  // ctx.fillRect(0, 0, canvas.width, SIZE + PADDING)

  // Footer
  // ctx.fillStyle = '#eee'
  // ctx.fillRect(0, canvas.height - SIZE, canvas.width, canvas.height)

  /**
   * Profile Face
   */
  let imageData = profileFace.imageData
  if (imageData.width !== SIZE) {
    imageData = await resizeImage(imageData, SIZE, SIZE)
  }
  ctx.putImageData(imageData, 0, 0)

  const recognizedName = await blinder.recognize(profileFace) || 'Name me!'

  ctx.font         = 'bold 30px sans-serif'
  ctx.fillStyle    = '#333'
  ctx.strokeStyle  = '#333'
  ctx.textBaseline = 'middle'
  ctx.fillText(recognizedName, SIZE + 20, SIZE / 2)

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
   * Similar Faces
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
    const dist    = profileFace.distance(face)
    const percent = dist > 1 ? 0 : (1 - dist) * 100
    name = await blinder.remember(face) || ''

    ctx.font         = '12px sans-serif'
    ctx.fillStyle    = '#333'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      `${id} / ${percent.toFixed(0)}% / ${name}`,
      col * SIZE + 10,
      (row + 1 + 1) * (SIZE + PADDING) - PADDING / 2,
    )
  }

  /**
   * QR Code
   */
  const qrImage = await loadImage(GITHUB_URL_QRCODE)
  imageData = imageToData(qrImage)

  if (imageData.width !== SIZE) {
    imageData = await resizeImage(imageData, SIZE, SIZE)
  }
  ctx.putImageData(
    imageData,
    SIZE * 2,
    height - SIZE,
  )

  ctx.fillStyle    = '#333'
  ctx.textBaseline = 'middle'

  ctx.font = '14px sans-serif'
  ctx.fillText(
    '© 2017 Huan',
    0 + 10,
    height - SIZE + 105,
  )

  const footer = [
    'Blinder Powered by: FaceBlinder',
    'Wechat Bot SDK Powered by: Wechaty',
    'Face Recognization Powered by: Facenet',
  ].join('\n')

  ctx.font = '9px sans-serif'
  ctx.fillText(
    footer,
    0 + 10,
    height - SIZE + 120,
  )

  ctx.font = 'bold 30px sans-serif'
  ctx.fillText(
    'WechatyBlinder',
    0 + 10,
    height - SIZE + 35,
  )

  // ctx.fillText(
  //   'Blinder',
  //   0 + 10,
  //   height - (SIZE + PADDING) + 60,
  // )

  /**
   * Save to file
   */
  imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  await saveImage(imageData, file)
}

export default onMessage
