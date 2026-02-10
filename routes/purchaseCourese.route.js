import express from "express";
import {
    createCheckoutSession,
    getCoursePurchaseStatus,
    getPurchasedCourses
} from "../controllers/coursePurchase.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 1. Buy Course 
router.route("/checkout/create-checkout-session")
    .post(isAuthenticated, createCheckoutSession);

// 2. Check Status
router.route("/course/:courseId/detail-with-status")
    .get(isAuthenticated, getCoursePurchaseStatus);

// 3. My Courses
router.route("/")
    .get(isAuthenticated, getPurchasedCourses);

export default router;