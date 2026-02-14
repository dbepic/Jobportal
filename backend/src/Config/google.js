import "dotenv/config.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../Config/db.js";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;

                let user = await prisma.user.findUnique({
                    where: { googleId: profile.id },
                });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            googleId: profile.id,
                            email,
                            name: profile.displayName,
                            avatar: profile.photos?.[0]?.value,
                        },
                    });
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

/* 🔐 Session handling */
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;
