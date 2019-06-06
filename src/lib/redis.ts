import Redis from 'ioredis'
const redis = new Redis({
  enableOfflineQueue: false
})

export default redis
