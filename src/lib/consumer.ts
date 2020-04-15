import { ObjectID } from 'mongodb'
import redis from './redis'
import logger from './logger'
import * as db from './db'
import { REMOVE_STREAM } from '../config'

const REMOVE_STREAM_TO_CHAT = 'stream:remove:user:chat'

export const remove = async (user: string) => {
  const userId = new ObjectID(user)
  const target = await db.collections.users.findOne({ _id: userId })
  if (!target) {
    return
  }
  const remove = { ...target, originId: target._id }
  delete remove['_id']
  await db.collections.removed.findOneAndUpdate(
    { originId: userId },
    { $set: remove },
    { upsert: true }
  )
  await db.collections.users.deleteOne({ _id: target._id })
  await redis.xadd(REMOVE_STREAM_TO_CHAT, '*', 'user', user)
}

export const parser = async (read) => {
  if (!read) {
    return
  }

  let nextId = null

  for (const [, val] of read) {
    for (const [id, messages] of val) {
      nextId = id
      try {
        const user = messages[1]
        await remove(user)
      } catch (e) {
        logger.error('parse error', e, id, messages)
      }
    }
  }

  return nextId
}

export const consume = async (startId: string = '$') => {
  let nextId = startId ? startId : '$'

  try {
    const res = await redis.xread(
      'BLOCK',
      '1000',
      'COUNT',
      '100',
      'STREAMS',
      REMOVE_STREAM,
      startId
    )
    nextId = await parser(res)
  } catch (e) {
    logger.error('[read]', REMOVE_STREAM, e)
  }

  await consume(nextId)
}
