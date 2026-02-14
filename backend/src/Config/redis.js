import "dotenv/config.js"
import logger from "../Service/logger.js"
import Redis from 'ioredis'

const client = new Redis();


const Redisconnect = () => {
    try {
        client.on("connect", () => {
            logger.info(`successfully Redis connected`)
        })
    } catch (error) {
        client.on("error", (error) => {
            logger.error(`Redis connection error: ${error}`)
        })
    }
}

export default Redisconnect