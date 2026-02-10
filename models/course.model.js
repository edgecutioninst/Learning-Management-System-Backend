import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({

    title: {
        type: String,
        required: [true, "Please add a title"],
        trim: true,
        maxLength: [50, "Title can not be more than 50 characters"]
    },
    subtitle: {
        type: String,
        trim: true,
        maxLength: [200, "Course subtitle can not be more than 50 characters"]
    },
    description: {
        type: String,
        trim: true,
    },
    category: {
        type: String,
        required: [true, "Please add a category"],
        trim: true,
    },
    level: {
        type: String,
        enum: {
            values: ["beginner", "intermediate", "advanced"],
            message: "Please select a valid course level"
        },
        default: "beginner"
    },
    price: {
        type: Number,
        required: [true, "Please add a price"],
        min: [0, 'Price can not be negative']
    },
    thumbnail: {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
    },
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    lectures: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture"
    }],
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Please add a instructor"]
    },
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        }
    }],
    isPublished: {
        type: Boolean,
        default: false
    },
    totalDuration: {
        type: Number,
        default: 0
    },
    totalLectures: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }

})



courseSchema.virtual("averageRating").get(function () {
    if (!this.ratings || this.ratings.length === 0) return 0

    const totalRating = this.ratings.reduce((total, rating) => total + rating.rating, 0)
    return totalRating / this.ratings.length
})

courseSchema.pre("save", function () {
    if (this.lectures) {
        this.totalLectures = this.lectures.length

    }

})


const Course = mongoose.model("Course", courseSchema)
export default Course