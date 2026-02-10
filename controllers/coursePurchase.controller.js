import Course from "../models/course.model.js";
import CoursePurchase from "../models/coursePurchase.model.js";
import User from "../models/user.model.js";
import { catchAsync, ApiError } from "../middlewares/error.middleware.js";


export const createCheckoutSession = catchAsync(async (req, res) => {
  const userId = req.id;
  const { courseId } = req.body;

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError(404, "Course not found");

  // Check if already bought
  const existingPurchase = await CoursePurchase.findOne({
    course: courseId,
    user: userId,
    status: "completed"
  });

  if (existingPurchase) {
    return res.status(400).json({
      success: false,
      message: "You already own this course"
    });
  }

  const newPurchase = await CoursePurchase.create({
    course: courseId,
    user: userId,
    amount: course.price,
    currency: "INR",
    status: "completed",
    paymentMethod: "MOCK_FREE",
    paymentId: `mock_${Date.now()}` // fake Transaction ID
  });

  await Course.findByIdAndUpdate(courseId, {
    $addToSet: { enrolledStudents: userId }
  });

  await User.findByIdAndUpdate(userId, {
    $addToSet: { enrolledCourses: courseId }
  });

  return res.status(200).json({
    success: true,
    message: "Course purchased successfully (Mock)",
    url: `${process.env.CLIENT_URL}/course-progress/${courseId}`
  });
});


export const getCoursePurchaseStatus = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.id;

  const purchase = await CoursePurchase.findOne({
    course: courseId,
    user: userId,
    status: "completed"
  });

  res.status(200).json({
    success: true,
    purchased: !!purchase,
  });
});


export const getPurchasedCourses = catchAsync(async (req, res) => {
  const userId = req.id;

  const purchases = await CoursePurchase.find({
    user: userId,
    status: "completed"
  }).populate("course");

  if (!purchases) {
    return res.status(200).json({ purchasedCourse: [] });
  }

  const courseList = purchases.map(p => p.course);

  res.status(200).json({
    success: true,
    purchasedCourse: courseList
  });
});