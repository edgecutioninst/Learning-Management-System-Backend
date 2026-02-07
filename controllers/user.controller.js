import { ApiError, catchAsync } from "../middlewares/error.middleware.js"
import User from "../models/user.model.js"
import generateToken from "../utils/generateToken.js"
import { uploadMedia, deleteMediaFromCloudinary, deleteVideoFromCloudinary } from "../utils/cloudinary.js"

export const createUserAccount = catchAsync(async (req, res) => {
    const { name, email, password, role = "student" } = req.body

    //will do globally
    const existingUser = User.findOne({ email: email.toLowerCase() })

    if (existingUser) {
        throw new ApiError('User already exists', 400)
    }

    const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role
    })

    await user.updateLastActive()

    generateToken(res, user, "Account created successfully")

    return res.status(201).json(user, "Account created successfully")
})

export const authenticateUser = catchAsync(async (req, res) => {
    const { email, password } = req.body

    const user = User.findOne({ email: email.toLowerCase() }).select("+password")

    if (!user || (await comparePassword(password, user.password))) {
        throw new ApiError('Invalid email or password', 401)
    }

    await user.updateLastActive()

    generateToken(res, user, `Login successful. Welcome back ${user.name}`)

    return res.status(200).json(user, "Login successful")

})


export const signOutUser = catchAsync(async (_, res) => {
    res.cookie('token', "", { maxAge: 0 })
    res.status(200).json({ success: true, message: "Logout successful" })
})


export const getCurrentUserProfile = catchAsync(async (req, res) => {
    // have injected this in auth m/w
    const user = User.findById(req.id).populate({
        path: "enrolledCourses.course",
        select: "title thumbnail description"
    })

    if (!user) {
        throw new ApiError("User not found", 404)
    }

    res.staus(200).json({
        success: true,
        data: {
            ...user.toJSON(),
            //totalEnrolledCourses is a virtual field
            totalEnrolledCourses: user.totalEnrolledCourses
        }
    })
})

export const updateUserProfile = catchAsync(async (req, res) => {
    const { name, email, bio } = req.body

    const updateData = { name, email: email?.toLowerCase(), bio }

    if (req.file) {
        const avatarResult = await uploadMedia(req.file.path)
        updateData.avatar = avatarResult.secure_url

        //delete old avatar
        const user = await User.findById(req.id)
        if (user.avatar && user.avatar !== 'default-avatar.png') {
            await deleteMediaFromCloudinary(user.avatar)
        }
    }

    //update user
    const updatedUser = await User.findByIdAndUpdate(req.id, updateData, { new: true, runValidators: true })

    if (!updatedUser) {
        throw new ApiError("User not found", 404)
    }

    res.status(200).json({
        success: true,
        data: updatedUser,
        message: "Profile updated successfully"
    })

})