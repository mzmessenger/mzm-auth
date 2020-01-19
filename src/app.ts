import express from 'express'
import { Response } from 'express'
import helmet from 'helmet'
import session from 'express-session'
import passport from 'passport'
import { Strategy as TwitterStrategy } from 'passport-twitter'
import connectRedis from 'connect-redis'
import logger from './lib/logger'
import {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_CALLBACK_URL,
  SESSION_SECRET
} from './config'
import * as handlers from './handlers'
import client from './lib/redis'

const dev = process.env.NGODE_ENV !== 'production'

const RedisStore = connectRedis(session)
const app = express()

app.use(helmet())
app.use(
  session({
    store: new RedisStore({ client, db: 1 }),
    name: 'mzm',
    secret: SESSION_SECRET,
    resave: false,
    rolling: true,
    saveUninitialized: false,
    cookie: { secure: !dev, maxAge: 24 * 60 * 60 * 1000 * 30 }
  })
)
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(handlers.serializeUser)
passport.deserializeUser(handlers.deserializeUser)

passport.use(
  new TwitterStrategy(
    {
      consumerKey: TWITTER_CONSUMER_KEY,
      consumerSecret: TWITTER_CONSUMER_SECRET,
      callbackURL: TWITTER_CALLBACK_URL,
      includeEmail: true
    },
    async (token, tokenSecret, profile, done) => {
      handlers.twitterLogin(profile.id, profile.username, done)
    }
  )
)

app.get('/auth/twitter', passport.authenticate('twitter'))
app.get(
  '/auth/twitter/callback',
  passport.authenticate('twitter', {
    successRedirect: '/login/success',
    failureRedirect: '/'
  })
)

app.get('/auth', handlers.auth)

app.get('/auth/logout', (req: any, res: Response) => {
  req.logout()
  res.redirect('/')
})

app.delete('/auth/user', handlers.remove)

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
  res.status(500).send('Internal Server Error')
  logger.error('[Internal Server Error]', err)
})

export default app
