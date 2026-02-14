import express from 'express';
import UserController from '../Controller/userController.js';
import { AvatarUpload, ResumeUpload } from '../Utils/multer.js'
import { Authorization, Adminverfication } from '../Middleware/generateToken.js';
const userRouter = express.Router();

userRouter.post('/register', AvatarUpload, UserController.register);
userRouter.post('/login', UserController.login);
userRouter.post('/update', Authorization, ResumeUpload, UserController.update);
userRouter.post('/forgot-password', Authorization, UserController.forgotpassword);
userRouter.post('/verify-otp', Authorization, UserController.verifypassword);
userRouter.post('/reset-password', Authorization, UserController.resetpassword);
userRouter.post('/logout', Authorization, UserController.logout)


export default userRouter;