import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";
import { catchAsync } from "../middlewares/error.middleware.js";
import { ApiError } from "../middlewares/error.middleware.js";
import crypto from "crypto";
import { generateToken } from "../utils/generateToken.js";

/**
 * Create a new user account
 * @route POST /api/v1/users/signup
 */
export const createUserAccount = catchAsync(async (req, res) => {

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email })

    if (existingUser) {
        throw new ApiError("User already exists", 400)
    }

    const user = await User.create({
        name,
        email,
        password
    })

    generateToken(res, user, "Account created successfully");

    res.status(200).json({
        success: true,
        message: "User created successfully"
    })

});

/**
 * Authenticate user and get token
 * @route POST /api/v1/users/signin
 */
export const authenticateUser = catchAsync(async (req, res) => {

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password")

    if (!user) {
        throw new ApiError("Invalid credentials", 401)
    }

    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
        throw new ApiError("Invalid credentials", 401)
    }

    generateToken(res, user, "Login successful");

});

/**
 * Sign out user and clear cookie
 * @route POST /api/v1/users/signout
 */
export const signOutUser = catchAsync(async (_, res) => {
    return res.status(200).cookie("token", "", {
        maxAge: 0
    }).json({
        message: "Logged out successfully",
        success: true
    });
});

/**
 * Get current user profile
 * @route GET /api/v1/users/profile
 */
export const getCurrentUserProfile = catchAsync(async (req, res) => {

    const user = await User.findById(req.id).select("-password")

    res.status(200).json({
        success: true,
        user
    })

});

/**
 * Update user profile
 * @route PATCH /api/v1/users/profile
 */
export const updateUserProfile = catchAsync(async (req, res) => {

    const user = await User.findById(req.id)

    if (!user) {
        throw new ApiError("User not found", 404)
    }

    const { name, email } = req.body;

    if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            throw new ApiError(400, "Email already taken");
        }
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({
        success: true,
        user
    })

});

/**
 * Change user password
 * @route PATCH /api/v1/users/password
 */
export const changeUserPassword = catchAsync(async (req, res) => {

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Please provide current password and new password")
    }

    const user = await User.findById(req.id).select("+password")

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Current password is incorrect")
    }

    user.password = newPassword
    await user.save()

    res.status(200).json({
        success: true,
        message: "Password changed successfully"
    })

});

/**
 * Request password reset
 * @route POST /api/v1/users/forgot-password
 */
export const forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/users/reset-password/${resetToken}`;

    res.status(200).json({
        success: true,
        message: "Reset token generated successfully (Check response body)",
        resetToken,
        resetUrl
    });
});
/**
 * Reset password
 * @route POST /api/v1/users/reset-password/:token
 */
export const resetPassword = catchAsync(async (req, res) => {

    const { token } = req.params;
    const { password } = req.body;

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex")

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    })


    if (!user) {
        throw new ApiError(400, "Password reset token is invalid or has expired");
    }

    user.password = password

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Password reset successfully"
    });

});

/**
 * Delete user account
 * @route DELETE /api/v1/users/account
 */
export const deleteUserAccount = catchAsync(async (req, res) => {

    const userId = req.id;

    const user = await User.findById(userId)

    if (!userId) {
        throw new ApiError("User not found", 404)
    }

    await user.deleteOne()

    res.status(200).clearCookie("token").json({
        success: true,
        message: "User deleted successfully"
    })

});
