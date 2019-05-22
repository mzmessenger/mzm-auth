import express from 'express'
import { Response } from 'express'
import helmet from 'helmet'
import session from 'express-session'
import passport from 'passport'
import { Strategy as TwitterStrategy } from 'passport-twitter'
import { ObjectID } from 'mongodb'
import logger from './logger'
import * as db from './db'
import {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_CALLBACK_URL,
  SESSION_SECRET
} from './config'

const dev = process.env.NODE_ENV !== 'production'

const app = express()

app.use(helmet())
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: !dev }
  })
)
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user: db.User, done) => {
  done(null, user._id)
})
passport.deserializeUser((id: string, done) => {
  db.collections.users
    .findOne({ _id: new ObjectID(id) })
    .then(user => {
      done(null, user)
    })
    .catch(err => done(err))
})

passport.use(
  new TwitterStrategy(
    {
      consumerKey: TWITTER_CONSUMER_KEY,
      consumerSecret: TWITTER_CONSUMER_SECRET,
      callbackURL: TWITTER_CALLBACK_URL,
      includeEmail: true
    },
    async (token, tokenSecret, profile, done) => {
      try {
        const filter = {
          twitterId: profile.id
        }
        const update: db.User = {
          twitterId: profile.id,
          twitterUserName: profile.username
        }

        const updated = await db.collections.users.findOneAndUpdate(
          filter,
          { $set: update },
          {
            upsert: true
          }
        )
        logger.info(
          `[auth:update:twitter] id: ${updated.value._id}, profile:`,
          {
            id: profile.id,
            username: profile.username
          }
        )
        done(null, updated.value)
      } catch (e) {
        logger.error('[auth:update:twitter] error:', profile)
        done(e)
      }
    }
  )
)

app.get('/auth/twitter', passport.authenticate('twitter'))
app.get(
  '/auth/twitter/callback',
  passport.authenticate('twitter', {
    successRedirect: '/',
    failureRedirect: '/auth/twitter'
  })
)

app.get('/auth', (req: any, res: Response) => {
  if (req.user) {
    const user = req.user as db.User
    const id = user._id.toHexString()
    res.setHeader('X-USER-ID', id)
    res.setHeader('X-TWITTER-USER-NAME', user.twitterUserName)
    logger.info('[auth] id:', id)
    return res.status(200).send('ok')
  }
  res.status(401).send('not login')
})

app.get('/auth/logout', (req: any, res: Response) => {
  req.logout()
  res.redirect('/')
})

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
  res.status(500).send('Internal Server Error')
  logger.error('[Internal Server Error]', err)
})

export default app
