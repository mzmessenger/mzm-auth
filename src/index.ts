import http from 'http'
import logger from './lib/logger'
import * as db from './lib/db'
import app from './app'
import { SERVER_LISTEN } from './config'
import { consume } from './lib/consumer'

const server = http.createServer(app)

db.connect()
  .then(() => {
    server.listen(SERVER_LISTEN, () => {
      logger.info('Listening on', server.address())
    })
    consume()
  })
  .catch(e => {
    logger.error(e)
    process.exit(1)
  })
