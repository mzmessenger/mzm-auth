import { ObjectID } from 'mongodb'
import { Request, Response } from 'express'
import * as db from './lib/db'
import logger from './lib/logger'
import redis from './lib/redis'
import { REMOVE_STREAM } from './config'

type Serialize = db.User
type Deserialize = string
type RequestUser = db.User
type PassportRequest = Request & { user?: RequestUser }

export function auth(req: PassportRequest, res: Response) {
  if (req.user) {
    const id = req.user._id.toHexString()
    res.setHeader('X-USER-ID', id)
    res.setHeader('X-TWITTER-USER-NAME', req.user.twitterUserName)
    logger.info('[auth] id:', id)
    return res.status(200).send('ok')
  }
  res.status(401).send('not login')
}

export function serializeUser(
  user: Serialize,
  done: (err, user: Deserialize) => void
) {
  done(null, user._id.toHexString())
}

export function deserializeUser(
  user: Deserialize,
  done: (err, user?: RequestUser) => void
) {
  db.collections.users
    .findOne({ _id: new ObjectID(user) })
    .then(user => {
      done(null, user)
    })
    .catch(err => done(err))
}

export async function twitterLogin(
  twitterId: string,
  userName: string,
  cb: (error: any, user?: Serialize) => void
) {
  try {
    const filter = {
      twitterId: twitterId
    }
    const update: db.User = {
      twitterId: twitterId,
      twitterUserName: userName
    }

    const updated = await db.collections.users.findOneAndUpdate(
      filter,
      { $set: update },
      {
        upsert: true
      }
    )
    logger.info(`[auth:update:twitter] id: ${updated.value._id}, profile:`, {
      id: twitterId,
      username: userName
    })
    cb(null, updated.value)
  } catch (e) {
    logger.error('[auth:update:twitter] error:', twitterId, userName)
    cb(e)
  }
}

export async function remove(req: PassportRequest, res: Response) {
  if (req.user) {
    await redis.xadd(REMOVE_STREAM, '*', 'user', req.user._id.toHexString())
    return res.status(200).send('ok')
  }
  return res.status(401).send('not auth')
}
