import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Please add a title"],
        trim: true,
        maxLength: [50, "Title can not be more than 50 characters"]
    },
    description: {
        type: String,
        required: [true, "Please add a description"],
        trim: true,
        maxLength: [200, "Description can not be more than 200 characters"]
    },
    videoUrl: {
        type: String,
        required: [true, "Please add a video"],
    },
    duration: {
        type: Number,
        default: 0
    },
    publicId: {
        type: String,
        required: [true, "publicId is required"]
    },
    isPreview: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        required: [true, "Please add an order"],
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }

})


lectureSchema.pre("save", function (next) {
    if (this.duration) {
        this.duration = Math.round(this.duration * 100) / 100;
    } next()
})


export const Lecture = mongoose.model("Lecture", lectureSchema)