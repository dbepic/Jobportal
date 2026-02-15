import express from 'express';
import passport from 'passport';
import { Accesstoken, Authorization } from '../Middleware/generateToken.js'
import logger from '../Service/logger.js';
const Authrouter = express.Router();



Authrouter.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

Authrouter.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    async (req, res) => {
        try {
            const user = req.user;

            const token = await Accesstoken(user.id);

            res.cookie("accesstoken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 15 * 60 * 1000
            })


            return res.redirect(`${process.env.CLIENT_URL}/auth-success`);

        } catch (error) {
            console.log(error);
            logger.error("Google callback error", error);
            return res.redirect(`${process.env.CLIENT_URL}/login`);
        }
    });

Authrouter.get("/me", Authorization, (req, res) => {
    res.json({
        success: true,
        user: req.user,
    });
});



export default Authrouter