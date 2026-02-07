import jwt from 'jsonwebtoken'
import { ApiError, catchAsync } from "./error.middleware";

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