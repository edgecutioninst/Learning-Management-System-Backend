import Course from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import User from "../models/user.model.js";
import { deleteMediaFromCloudinary, uploadMedia, deleteVideoFromCloudinary } from "../utils/cloudinary.js";
import { catchAsync } from "../middlewares/error.middleware.js";
import { ApiError } from "../middlewares/error.middleware.js";

/**
 * Create a new course
 * @route POST /api/v1/courses
 */
export const createNewCourse = catchAsync(async (req, res) => {
  const { title, subtitle, description, category, level, price } = req.body;

  if (!title || !subtitle || !description || !category || !level) {
    throw new ApiError("All fields are required", 400)
  }

  if (!req.file) {
    throw new ApiError("Course thumbnail is required", 400);
  }

  const cloudRes = await uploadMedia(req.file.path)

  if (!cloudRes) {
    throw new ApiError("Error uploading media", 400)
  }

  const course = await Course.create({
    title,
    subtitle,
    description,
    category,
    level,
    price,
    thumbnail: {
      public_id: cloudRes.public_id,
      url: cloudRes.secure_url
    },
    instructor: req.id,

  })

  return res.status(201).json({
    success: true,
    message: "Course created successfully",
    course
  });

});

/**
 * Search courses with filters
 * @route GET /api/v1/courses/search
*/
export const searchCourses = catchAsync(async (req, res) => {
  const { keyword = "" } = req.query;

  const searchCriteria = {
    isPublished: true, // Only show published courses
    $or: [
      { title: { $regex: keyword, $options: "i" } },
      { subtitle: { $regex: keyword, $options: "i" } },
      { category: { $regex: keyword, $options: "i" } }
    ]
  };

  const courses = await Course.find(searchCriteria)
    .populate({ path: "instructor", select: "name avatar" });

  return res.status(200).json({
    success: true,
    courses
  });
});


/**
 * Get all published courses
 * @route GET /api/v1/courses/published
 */
export const getPublishedCourses = catchAsync(async (req, res) => {

  const courses = await Course.find({ isPublished: true })
    .populate({ path: "instructor", select: "name avatar" })
    .sort({ createdAt: -1 });

  if (!courses) {
    return res.status(200).json({
      success: true,
      courses: []
    });
  }

  return res.status(200).json({
    success: true,
    courses,
  });
});


/**
 * Get courses created by the current user
 * @route GET /api/v1/courses/my-courses
 **/
export const getMyCreatedCourses = catchAsync(async (req, res) => {
  const courses = await Course.find({ instructor: req.id }).sort({ createdAt: -1 })

  if (!courses) {
    throw new ApiError(404, "No courses found");
  }

  return res.status(200).json({
    success: true,
    message: "Courses fetched successfully",
    courses,
  })

});

/**
 * Update course details
 * @route PATCH /api/v1/courses/:courseId
 */
export const updateCourseDetails = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { title, subtitle, description, category, level, price } = req.body;

  const course = await Course.findById(courseId);

  if (!course) {
    throw new ApiError(404, "Course not found");
  }

  if (title) course.title = title;
  if (subtitle) course.subtitle = subtitle;
  if (description) course.description = description;
  if (category) course.category = category;
  if (level) course.level = level;
  if (price !== undefined) course.price = price;

  if (req.file) {
    console.log("Uploading new thumbnail...");

    const cloudRes = await uploadMedia(req.file.path);

    if (course.thumbnail?.public_id) {
      await deleteMediaFromCloudinary(course.thumbnail.public_id);
    }

    course.thumbnail = {
      public_id: cloudRes.public_id,
      url: cloudRes.secure_url
    };
  }

  await course.save();

  return res.status(200).json({
    success: true,
    message: "Course updated successfully",
    course
  });
});

/**
 * Get course by ID
 * @route GET /api/v1/courses/:courseId
 */
export const getCourseDetails = catchAsync(async (req, res) => {

  const { courseId } = req.params

  const course = await Course.findById(courseId)
    .populate({
      path: "instructor",
      select: "name avatar"
    })
    .populate({
      path: "lectures",
    });

  if (!course) {
    throw new ApiError("Course not found", 404)
  }


  return res.status(200).json({
    success: true,
    message: "Course fetched successfully",
    course
  })

});

/**
 * Add lecture to course
 * @route POST /api/v1/courses/:courseId/lectures
 */
export const addLectureToCourse = catchAsync(async (req, res) => {

  const { title, description, isPreview } = req.body;
  const { courseId } = req.params;

  const course = await Course.findById(courseId)

  if (!course) {
    throw new ApiError("Course not found", 404)
  }

  if (!req.file) {
    throw new ApiError("video file is required", 400)
  }

  const cloudRes = await uploadMedia(req.file.path)
  const durationInSeconds = cloudRes.duration || 0;

  if (!cloudRes) {
    throw new ApiError("Error uploading media", 400)
  }

  const lecture = await Lecture.create({
    title,
    description,
    videoUrl: cloudRes.secure_url,
    publicId: cloudRes.public_id,
    order: course.lectures.length + 1,
    isPreview: isPreview || false // Default to false
  })

  // Add lecture to course
  course.lectures.push(lecture._id)
  course.totalLectures = course.lectures.length

  course.totalDuration = (course.totalDuration || 0) + durationInSeconds;

  await course.save()


  return res.status(200).json({
    success: true,
    message: "Lecture added to course successfully",
    course,
    lecture
  })
});

/**
 * Get course lectures
 * @route GET /api/v1/courses/:courseId/lectures
 */
export const getCourseLectures = catchAsync(async (req, res) => {

  const { courseId } = req.params

  const course = await Course.findById(courseId)
    .populate({
      path: "lectures",
      options: { sort: { order: 1 } }
    })

  if (!course) {
    throw new ApiError("Course not found", 404)
  }


  return res.status(200).json({
    success: true,
    message: "Course lectures fetched successfully",
    lectures: course.lectures
  })

});


/** 
  editLecture 
  patch /api/v1/courses/:courseId/lectures/:lectureId 
*/
export const editLecture = catchAsync(async (req, res) => {
  const { lectureId } = req.params

  const { title, description } = req.body;

  const lecture = await Lecture.findById(lectureId)

  if (!lecture) {
    throw new ApiError("Lecture not found", 404)
  }

  if (title) lecture.title = title;
  if (description) lecture.description = description;

  if (req.file) {

    console.log("Uploading media...");

    const cloudRes = await uploadMedia(req.file.path)

    if (!cloudRes) {
      throw new ApiError("Error uploading media", 400)
    }

    await deleteVideoFromCloudinary(lecture.publicId)


    lecture.videoUrl = cloudRes.secure_url;
    lecture.publicId = cloudRes.public_id;
    lecture.duration = cloudRes.duration;
  }


  await lecture.save()


  return res.status(200).json({
    success: true,
    message: "Lecture updated successfully",
    lecture
  })

})


/**
  removeLectureFromCourse

  delete /api/v1/courses/:courseId/lectures/:lectureId

*/
export const removeLectureFromCourse = catchAsync(async (req, res) => {

  const { courseId, lectureId } = req.params

  const lecture = await Lecture.findById(lectureId)

  if (!lecture) {
    throw new ApiError("Lecture not found", 404)
  }

  if (lecture.publicId) {
    await deleteVideoFromCloudinary(lecture.publicId)
  }

  await Lecture.findByIdAndDelete(lectureId)

  const course = await Course.findByIdAndUpdate(courseId, {
    $pull: { lectures: lectureId }
  }, {
    new: true
  })

  return res.status(200).json({
    success: true,
    message: "Lecture removed from course successfully",
    course
  })

})


/***
    
  removeCourse

  delete /api/v1/courses/:courseId
  
*/
export const removeCourse = catchAsync(async (req, res) => {

  const { courseId } = req.params

  const course = await Course.findById(courseId)

  if (!course) {
    throw new ApiError("Course not found", 404)
  }

  if (course.thumbnail?.public_id) {
    await deleteMediaFromCloudinary(course.thumbnail.public_id)
  }

  const lectures = await Lecture.find({ _id: { $in: course.lectures } })

  for (const lecture of lectures) {
    if (lecture.public_id) {
      await deleteMediaFromCloudinary(lecture.public_id)
    }
  }

  await Course.findByIdAndDelete(courseId)

  return res.status(200).json({
    success: true,
    message: "Course removed successfully"
  })
})