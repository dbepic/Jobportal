import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import logger from "./Service/logger.js";
import authRouter from "./Router/authRoute.js";
import userRouter from "./Router/userRoute.js";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:4000"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        exposedHeaders: ["set-cookie", "Content-Type", "Authorization"],
    })
);

app.get("/", (req, res) => {
    logger.info(`Backend server working Now :)`);
    res.send("Hello World!");
});

app.use('/api', authRouter)
app.use('/api', userRouter)

export default app;
