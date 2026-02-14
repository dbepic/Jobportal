import "dotenv/config.js";
import jwt from 'jsonwebtoken';
import logger from "../Service/logger.js";
import prisma from "../Config/db.js";
import { StatusCodes } from 'http-status-codes'

const Accesstoken = async (userId) => {
    try {
        const token = jwt.sign({ id: userId },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
        )
        return token;
    } catch (error) {
        logger.error(`internal server error`)
    }
}

const Refreshtoken = async (userId) => {
    try {
        const token = jwt.sign({ id: userId },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "1d" }
        )
        const updateToken = await prisma.user.update({ where: { id: userId }, data: { refreshToken: token } })
        return token;
    } catch (error) {
        logger.error(`internal server error`)
    }
}


const Authorization = async (req, res, next) => {
    try {
        const token = req.cookies.accesstoken || req.headers?.authorization.split(",");
        if (!token) {
            logger.warn(`no token has been provided`);
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: "Unauthorized",
                success: false
            })
        }
        const decoded = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) {
            logger.warn(`no token is not vailid`);
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: "decoded is not vaild",
                success: false
            })
        }
        req.user = decoded.id;
        next();
    } catch (error) {
        logger.error(`internal server error`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "internal server error",
            success: false
        })
    }
}

const Adminverfication = async (req, res, next) => {
    try {
        const users = await prisma.user.findUnique({ id: users.id })

        if (!users || users.role !== "admin") {
            return res.status(StatusCodes.FORBIDDEN).json({
                message: "Admin access only",
                success: false,
            });
        }

        next();
    } catch (error) {
        logger.error(`internal server error`);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "internal server error",
            success: false
        })
    }
}

export { Accesstoken, Refreshtoken, Authorization, Adminverfication }