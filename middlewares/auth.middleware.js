import jwt from 'jsonwebtoken'
import { ApiError, catchAsync } from "./error.middleware.js";
import User from '../models/user.model.js'

//need next because it is a middleware
export const isAuthenticated = catchAsync(async (req, res, next) => {
    const token = req.cookies.token

    if (!token) {
        throw new ApiError(401, "Unauthorized Access")
    }

    try {
        const decoded = await jwt.verify(token, process.env.SECRET_KEY)
        req.id = decoded.userId

        next()

    } catch (error) {
        throw new ApiError(401, "Invalid Access Token")
    }
})

export const authorizeRoles = (...allowedRoles) => {
    return async (req, _, next) => {
        try {
            const user = await User.findById(req.id);

            if (!user) {
                return next(new ApiError(404, "User not found"));
            }

            if (!allowedRoles.includes(user.role)) {
                return next(new ApiError(403, "You do not have permission to perform this action"));
            }

            next();

        } catch (error) {
            next(new ApiError(500, "Role check failed"));
        }
    }
}