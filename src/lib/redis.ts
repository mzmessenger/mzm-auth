import Redis from 'ioredis'
const redis = new Redis({
  host: '127.0.0.1',
  enableOfflineQueue: false
})

export default redis
