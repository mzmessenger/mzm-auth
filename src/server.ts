import cluster from 'cluster'
import http from 'http'
import logger from './lib/logger'
import redis from './lib/redis'
import * as db from './lib/db'
import app from './app'
import { WORKER_NUM, SERVER_LISTEN } from './config'
import { initRemoveConsumerGroup, consume } from './lib/consumer'

const server = http.createServer(app)

if (cluster.isMaster) {
  for (let i = 0; i < WORKER_NUM; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    const s = signal || code
    logger.info(`exit worker #${worker.process.pid} (${s})`)
    cluster.fork()
  })
} else {
  redis.once('ready', async function connect() {
    logger.info('[redis] connected')
    try {
      await initRemoveConsumerGroup()
      await db.connect()

      server.listen(SERVER_LISTEN, () => {
        logger.info('Listening on', server.address())
      })

      consume()
    } catch (e) {
      redis.emit('error', e)
    }
  })

  redis.on('error', function error(e) {
    logger.error(e)
    process.exit(1)
  })
}
