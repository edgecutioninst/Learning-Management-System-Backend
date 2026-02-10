import express from "express";
import {
    createNewCourse,
    searchCourses,
    getPublishedCourses,
    getMyCreatedCourses,
    updateCourseDetails,
    getCourseDetails,
    addLectureToCourse,
    getCourseLectures,
    editLecture,
    removeLectureFromCourse,
    removeCourse
} from "../controllers/course.controller.js";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.middleware.js";
import upload from "../utils/multer.js";

const router = express.Router();

// Public routes
router.get("/published-courses", getPublishedCourses);
router.get("/search", searchCourses);

// Protected routes (Instructor)
router.route("/")
    .post(
        isAuthenticated,
        authorizeRoles("instructor"),
        upload.single("courseThumbnail"),
        createNewCourse
    );
//
router.get("/my-courses", isAuthenticated, authorizeRoles("instructor"), getMyCreatedCourses);

router.route("/:courseId")
    .patch(
        isAuthenticated,
        authorizeRoles("instructor"),
        upload.single("courseThumbnail"),
        updateCourseDetails
    )
    .get(isAuthenticated, getCourseDetails)
    .delete(isAuthenticated, authorizeRoles("instructor"), removeCourse);
// 
router.route("/:courseId/lecture")
    .post(
        isAuthenticated,
        authorizeRoles("instructor"),
        upload.single("video"),
        addLectureToCourse
    )
    .get(isAuthenticated, getCourseLectures);
//
router.route("/:courseId/lecture/:lectureId")
    .patch(isAuthenticated, authorizeRoles("instructor"), editLecture)
    .delete(isAuthenticated, authorizeRoles("instructor"), removeLectureFromCourse);
//

export default router;