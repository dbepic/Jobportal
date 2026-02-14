import express from "express";
import passport from "passport";
import { Accesstoken } from "../Middleware/generateToken.js";

const Authrouter = express.Router();


Authrouter.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/login",
        session: false,
    }),
    async (req, res) => {
        try {
            const user = req.user;

            const token = await Accesstoken(user.id);

            const cookieOptions = {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                maxAge: 15 * 60 * 1000,
            };


            res.cookie("accessToken", token, cookieOptions);

            res.redirect(`${process.env.CLIENT_URL}/home`);
        } catch (error) {
            console.error("Google OAuth error:", error);
            res.redirect(`${process.env.CLIENT_URL}/login?success=false`);
        }
    }
);


export default Authrouter