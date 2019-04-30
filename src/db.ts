import { MongoClient, Collection, ObjectID } from 'mongodb'
import { MONGODB_URI } from './config'
import logger from './logger'

export const collections: { users: Collection<User> } = { users: null }

export async function connect() {
  const client = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true
  })

  collections.users = client.db('auth').collection('users')

  logger.info('[db] connected mongodb')

  return client
}

export type User = {
  _id?: ObjectID
  twitterId: string
  twitterUserName: string
}
