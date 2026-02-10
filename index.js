import express from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import helmet from "helmet";
import ExpressMongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./database/db.js";

import dotenv from "dotenv";
dotenv.config();

//api imports: 
import healthRoute from "./routes/health.route.js";
import userRoute from "./routes/user.route.js"
import mediaRoute from "./routes/media.route.js"
import courseRoute from "./routes/course.route.js"
import courseProgressRoute from "./routes/courseProgress.route.js"
import purchaseCourseRoute from "./routes/purchaseCourese.route.js"

//connect to database:
connectDB();

const app = express();
const PORT = process.env.PORT || 9000;

//cors m/w:
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, //it allows us to access cookies
    methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'HEAD', 'PATCH', 'DELETE'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'device-remember-token',
        'Access-Control-Allow-Origin',
        'Origin',
        'Accept',
    ],
}));

//body parser m/w:
app.use(express.json({ limit: '15kb' }));
app.use(express.urlencoded({ extended: true, limit: '15kb' }));
app.use(cookieParser()); // it allows us to access cookies

//logging m/w:
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

//global rate limiter:
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100, //limit of 100 requests per 15 minutes from an IP
    message: "Too many requests from this IP, please try again after 15 minutes"
});

//security m/w:
app.use(helmet()); // it sets various HTTP headers to help protect your app from common vulnerabilities
app.use("/api", limiter);
// app.use(hpp()); // it prevents HTTP parameter pollution

//data sanitization against database query injection:
// app.use(ExpressMongoSanitize());


// 🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨
//api routes:
app.use("/api/v1/healthcheck", healthRoute)
app.use("/api/v1/user", userRoute)
app.use("/api/v1/media", mediaRoute)
app.use("/api/v1/course", courseRoute)
app.use("/api/v1/progress", courseProgressRoute)
app.use("/api/v1/purchase", purchaseCourseRoute)

//404 handler:
app.use((_, res) => {
    res.status(404).json({
        message: "Route not found"
    })
});

//global error handler:
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
})