import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto"; // for generating random strings


const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Please add a name"],
        unique: true,
        trim: true,
        maxlength: [50, "Name can not be more than 50 characters"]
    },

    email: {
        type: String,
        required: [true, "Please add an email"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/, 'Please add a valid email'] // regular expression to validate email regex

    },

    password: {
        type: String,
        required: [true, "Please add a password"],
        minlength: [8, "Password must be at least 8 characters"],
        select: false,
    },

    role: {
        type: String,
        enum: {
            value: ["student", "instructor", "admin"],
            message: "Please select a valid role"
        },

        default: "student",
    },

    avatar: {
        type: String,
        default: "default-avatar.png",
    },

    bio: {
        type: String,
        maxlength: [200, "Bio can not be more than 200 characters"],
    },

    enrolledCourses: [{
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
        },
        enrolledAt: {
            type: Date,
            default: Date.now
        }
    }],

    createdCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
    }],

    resetPasswordToken: String,

    resetPasswordExpire: Date,

    lastActive: {
        type: Date,
        default: Date.now
    },

}, {
    timestamps: true,
    toJSON: { virtuals: true }, // enable virtual fields
    toObject: { virtuals: true } // enable virtual fields
})



//hash password: 
userSchema.pre('save', async function (next) {

    if (!this.isModified("password")) next()

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

//compare password: 
userSchema.methods.comparePassword = async function (newPassword) {
    return await bcrypt.compare(newPassword, this.password)
}

//generate reset password token: 
userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")

    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000 // 10 minutes
    return resetToken
}

userSchema.methods.updateLastActive = function () {
    this.lastActive = Date.now()
    return this.save({ validateBeforeSave: false })
}

//virtual - ghost field, use toJSON to make them appear in the response
//virtual field for total enrolled courses:
userSchema.virtual("totalEnrolledCourses").get(function () {
    return this.enrolledCourses.length
})

const User = mongoose.model("User", userSchema);
export default User;