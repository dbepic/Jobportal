import prisma from "../Config/db.js";
import { StatusCodes } from 'http-status-codes'
import logger from "../Service/logger.js";
import bcrypt from 'bcryptjs'
import cloudnary from '../Config/cloudnary.js'
import getdatauri from "../Utils/datauri.js";
import generateOtp from "../Service/generateOtp.js";
import { Accesstoken, Refreshtoken } from "../Middleware/generateToken.js"
import { success } from "zod";
import { verify } from "node:crypto";


const UserController = {
    register: async (req, res) => {
        try {
            const { username, email, password, role } = req.body;
            if (!username || !email || !password) {
                logger.warn(`All field must required`);
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: "All field must be required",
                    success: false
                })
            }
            let exitingUser = await prisma.user.findUnique({ where: { email } })
            if (exitingUser) {
                logger.warn(`User already exists`);
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: "User already exists",
                    success: false
                })
            }
            let avatarurl = null;
            const file = req.file;
            if (file) {
                const parser = getdatauri(file);
                const cloudResponse = await cloudnary.uploader.upload(parser.content, {
                    folder: "avatar-pic"
                })
                avatarurl = cloudResponse.secure_url
            }
            const saltrounds = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, saltrounds);

            const newUser = await prisma.user.create({
                data: {
                    username,
                    email,
                    password: hashedPassword,
                    role,
                    avatar: avatarurl
                },
                include: {
                    profile: true
                }
            })

            newUser.password = undefined
            logger.info(`successfully register the User`);

            return res.status(StatusCodes.CREATED).json({
                message: "User registered successfully",
                success: true,
                user: newUser
            })

        } catch (error) {
            console.log(error)
            logger.error(`internal server error`);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "internal server error",
                success: false
            })
        }
    },
    login: async (req, res) => {
        try {
            const { email, password, role } = req.body;
            if (!email || !password) {
                logger.warn(`All field must required`);
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: "All field must be required",
                    success: false
                })
            }
            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                logger.warn(`E-mail is  invalid`);
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: "E-mail is id invalid",
                    success: false
                })
            }
            let isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                logger.warn(`Incorrect password is invalid`);
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: "Incorrect password is invalid",
                    success: false
                })
            }
            if (user.status !== "active") {
                logger.warn(`user is inactive`);
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    message: "User is inactive",
                    success: false
                })
            }
            if (user.role !== "admin") {
                logger.warn(`user role is unauthorized`);
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    message: "user is not admin",
                    success: false
                })
            }
            const accesstoken = await Accesstoken(user.id);
            const refreshtoken = await Refreshtoken(user.id);
            const updateuser = await prisma.user.update({
                where: { id: user.id }, data: {
                    lastLogin: new Date()
                }
            })

            const cookieOptions = {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 15 * 60 * 1000
            }
            res.cookie("accesstoken", accesstoken, cookieOptions);
            res.cookie("refreshtoken", refreshtoken, cookieOptions);

            res.status(StatusCodes.CREATED).json({
                message: `welcome back to ${user.username}`,
                data: {
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    lastLogin: user.lastLogin,
                    accesstoken,
                    refreshtoken
                },
                success: true
            })

        } catch (error) {
            console.log(error)
            logger.error(`internal server error`);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "internal server error",
                success: false
            })
        }
    },
    update: async (req, res) => {
        try {
            const { username, lname, phone, bio, skills, education } = req.body;

            const userId = req.user;
            let user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                logger.warn(`user is not found`);
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: "user is not found",
                    success: false
                })
            }
            let resume = [];
            if (req.files.resume) {
                for (const file of req.files.resume) {
                    const parser = getdatauri(file);
                    const cloudResponse = await cloudnary.uploader.upload(parser.content, {
                        folder: "resume-pic"
                    })
                    resume.push(cloudResponse.secure_url)
                }
            }
            const updateData = await prisma.user.update({
                where: { id: userId }, data: {
                    username,
                    lname,
                    phone,
                    profile: {
                        upsert: {
                            create: {
                                bio,
                                skills: skills ? skills.split(",") : [],
                                education: education ? education.split(",") : [],
                                resume: resume
                            },
                            update: {
                                bio,
                                skills: skills ? skills.split(",") : [],
                                education: education ? education.split(",") : [],
                                resume: resume
                            }
                        }
                    }
                }, include: { profile: true }
            },)
            updateData.password = undefined;
            logger.info(`successfully updated user details`);
            return res.status(StatusCodes.OK).json({
                message: "successfully updated",
                success: true,
                data: updateData
            })
        } catch (error) {
            console.log(error)
            logger.error(`internal server error`);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "internal server error",
                success: false
            })
        }
    },
    forgotpassword: async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                logger.warn("Email is required");
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: "Email is required",
                    success: false
                });
            }

            const user = await prisma.user.findUnique({ where: { email } });

            if (!user) {
                logger.warn("User not found");
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: "User not found",
                    success: false
                });
            }

            const otp = generateOtp();
            const expire = new Date(Date.now() + 15 * 60 * 1000);

            await prisma.user.update({
                where: { email },
                data: {
                    forgotpassword: otp,
                    forgotpasswordExp: expire
                }
            });

            logger.info("Successfully sent OTP to email");

            return res.status(StatusCodes.OK).json({
                message: "Successfully sent OTP",
                data: otp,
                success: true
            });

        } catch (error) {
            logger.error(`internal server error ${error}`)
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "Internal server error",
                success: false,
                error: error
            });
        }
    },
    verifypassword: async (req, res) => {
        try {
            const { otp } = req.body;
            const userId = req.user;

            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user || !user.forgotpassword) {
                return res.status(400).json({
                    message: "Invalid request",
                    success: false
                });
            }

            if (String(user.forgotpassword) !== String(otp)) {
                return res.status(400).json({
                    message: "OTP is not match",
                    success: false
                });
            }

            if (user.forgotpasswordExp < new Date()) {
                return res.status(400).json({
                    message: "OTP expired",
                    success: false
                });
            }

            return res.status(200).json({
                message: "OTP verified successfully",
                success: true
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Internal server error",
                success: false
            });
        }
    },


    resetpassword: async (req, res) => {
        try {
            const { password, confirmpassword } = req.body;
            if (!password || !confirmpassword) {
                logger.warn(`all field must required`);
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: "All field must required",
                    success: false
                })
            }
            if (password !== confirmpassword) {
                logger.warn(`password is not match`);
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: "password is not match",
                    success: false
                })
            }
            const userId = req.user;
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                logger.warn(`user is not found`);
                return res.status(StatusCodes.BAD_REQUEST).json({
                    message: "user is not found",
                    success: false
                })
            }
            const hashPassword = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { id: userId }, data: {
                    password: hashPassword
                }
            })
            logger.info(`password is reset successfully`);
            return res.status(StatusCodes.OK).json({
                message: "password is reset successfully",
                success: true
            })
        } catch (error) {
            console.log(error)
            logger.error(`internal server error`);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "internal server error",
                success: false
            })
        }
    },
    logout: async (req, res) => {
        try {
            const userId = req.user;
            let user = await prisma.user.findFirst({ where: { id: userId } });
            if (!user) {
                logger.warn(`user is not found!`);
                return res.status(StatusCodes.BAD_GATEWAY).json({
                    message: "user is not found",
                    success: false
                })
            }
            const cookieOptions = {
                http: true,
                secure: true,
                sameSite: "strict",
                maxAge: 0
            }
            res.cookie("accessstoken", Accesstoken, cookieOptions);
            res.cookie("refreshtoken", Refreshtoken, cookieOptions);

            logger.info(`user is logged out successfully`);
            return res.status(StatusCodes.OK).json({
                message: ` logged out successfully ${user.username}`,
                success: true
            })

        } catch (error) {
            console.log(error)
            logger.error(`internal server error`);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "internal server error",
                success: false
            })
        }
    }
}

export default UserController