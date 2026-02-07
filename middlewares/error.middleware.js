export class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}


//error middleware to catch async errors and pass them to the next middleware
export const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next)
    }
}


// //handle jwt error
// export const handleJWTError = () => {
//     new ApiError('Invalid token please login again', 401)
// }