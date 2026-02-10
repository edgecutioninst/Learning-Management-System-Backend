import { CourseProgress } from "../models/courseProgress.js";
import Course from "../models/course.model.js";
import { catchAsync, ApiError } from "../middlewares/error.middleware.js";

/**
 * Get user's progress for a specific course
 * @route GET /api/v1/progress/:courseId
 */
export const getUserCourseProgress = catchAsync(async (req, res) => {

  const { courseId } = req.params;
  const userId = req.id;

  let progress = await CourseProgress.findOne({
    course: courseId,
    user: userId
  }).populate({
    path: "course",
    select: "lectures"
  });

  if (!progress) {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError("Course not found", 404);
    }

    progress = await CourseProgress.create({
      user: userId,
      course: courseId,
      lectureProgress: course.lectures.map((lectureId) => ({
        lecture: lectureId,
        isCompleted: false,
      })),
    });
  }

  return res.status(200).json({
    success: true,
    message: "Course progress fetched",
    data: progress,
  });

});

/**
 * Update progress for a specific lecture
 * @route PATCH /api/v1/progress/:courseId/lectures/:lectureId
 */
export const updateLectureProgress = catchAsync(async (req, res) => {

  const { courseId, lectureId } = req.params;
  const userId = req.id;

  const progress = await CourseProgress.findOne({
    course: courseId,
    user: userId
  });

  if (!progress) {
    throw new ApiError("Course progress not found", 404);
  }

  const lectureIndex = progress.lectureProgress.findIndex(
    (lecture) => lecture.lecture.toString() === lectureId
  );

  if (lectureIndex === -1) {
    // If lecture is new, add it
    progress.lectureProgress.push({
      lecture: lectureId,
      isCompleted: true,
      lastWatched: new Date(),
    });
  } else { // If lecture exists, update it
    progress.lectureProgress[lectureIndex].isCompleted = true;
    progress.lectureProgress[lectureIndex].lastWatched = new Date();
  }

  await progress.save();

  return res.status(200).json({
    success: true,
    message: "Lecture progress updated",
    data: progress,
  });

});

/**
 * Mark entire course as completed
 * @route PATCH /api/v1/progress/:courseId/complete
 */
export const markCourseAsCompleted = catchAsync(async (req, res) => {

  const { courseId } = req.params;
  const userId = req.id;

  const progress = await CourseProgress.findOne({
    course: courseId,
    user: userId
  });

  if (!progress) {
    throw new ApiError("Course progress not found", 404);
  }

  progress.lectureProgress.forEach((lecture) => {
    lecture.isCompleted = true;
  });

  await progress.save();

  return res.status(200).json({
    success: true,
    message: "Course marked as completed",
    data: progress,
  });

});

/**
 * Reset course progress
 * @route PATCH /api/v1/progress/:courseId/reset
 */
export const resetCourseProgress = catchAsync(async (req, res) => {

  const { courseId } = req.params;
  const userId = req.id;

  const progress = await CourseProgress.findOne({
    course: courseId,
    user: userId
  });

  if (!progress) {
    throw new ApiError("Course progress not found", 404);
  }

  progress.lectureProgress.forEach((lecture) => {
    lecture.isCompleted = false;
    lecture.watchTime = 0;
  });

  await progress.save();

  return res.status(200).json({
    success: true,
    message: "Course progress reset",
    data: progress,
  });

});
