import "dotenv/config";
import app from "./app.js";
import prisma from "./Config/db.js";

import logger from './Service/logger.js'

const port = process.env.PORT;

const connectDb = async () => {
    try {
        await prisma.$connect();
        logger.info(`MYSQL database connected successfully :)`)
    } catch (error) {
        logger.error(error);
    }
}
connectDb();


app.listen(port, () => {
    logger.info(`🚀 Server running on port ${port}`)
});
