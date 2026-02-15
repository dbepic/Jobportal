import "dotenv/config.js"
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./db.js";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await prisma.user.findUnique({
                    where: { email: profile.emails[0].value },
                });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            username: profile.displayName,
                            email: profile.emails[0].value,
                            googleId: profile.id,
                            avatar: profile.photos?.[0]?.value,
                        },
                    });
                }

                return done(null, user);
            } catch (error) {
                logger.error(error)
                return done(error, null);
            }
        }
    )
);

export default passport;
