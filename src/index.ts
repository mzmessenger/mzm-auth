import http from 'http'
import logger from './logger'
import * as db from './db'
import app from './app'
import { SERVER_LISTEN } from './config'

const server = http.createServer(app)

db.connect().then(() => {
  server.listen(SERVER_LISTEN, () => {
    logger.info('Listening on', server.address())
  })
})
