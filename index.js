import express from "express";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import helmet from "helmet";
import ExpressMongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import cors from "cors";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 9000;

//global rate limiter:
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100, //limit of 100 requests per 15 minutes from an IP
    message: "Too many requests from this IP, please try again after 15 minutes"
});

//security m/w:
app.use(helmet()); // it sets various HTTP headers to help protect your app from common vulnerabilities
app.use("/api", limiter);
app.use(hpp()); // it prevents HTTP parameter pollution



//logging m/w:
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}


//body parser m/w:
app.use(express.json({ limit: '15kb' }));
app.use(express.urlencoded({ extended: true, limit: '15kb' }));
app.use(cookieParser()); // it allows us to access cookies


//data sanitization against database query injection:
app.use(ExpressMongoSanitize());

//global error handler:
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
})

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

//api routes:



//404 handler:
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    })
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
})

