import { config } from 'dotenv'
config()

export const {
  MONGODB_URI,
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_CALLBACK_URL,
  SESSION_SECRET
} = process.env

export const WORKER_NUM = 2

export const SERVER_LISTEN = 8000

export const REMOVE_STREAM = 'stream:remove:user'
