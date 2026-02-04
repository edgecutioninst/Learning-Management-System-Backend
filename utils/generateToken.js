import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

export const generateToken = (res, user, message) => {
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
        expiresIn: "1d"
    })

    return res.status(200)
        .cookie("token", token, {
            httpOnly: true, //accessible only by the web server
            sameSite: "strict", //prevents xss attacks
            maxAge: 24 * 60 * 60 * 1000 //1d
        })
        .json({
            success: true,
            message,
            user,
            token
        })
}