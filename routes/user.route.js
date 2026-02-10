import express from 'express';
import {
    authenticateUser,
    createUserAccount,
    getCurrentUserProfile,
    signOutUser,
    updateUserProfile,
    changeUserPassword,
    forgotPassword,
    resetPassword,
    deleteUserAccount,
} from '../controllers/user.controller.js';
import upload from '../utils/multer.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { validateSignUp } from '../middlewares/validation.middleware.js';

const router = express.Router();


//auth routes
router.post("/signup", validateSignUp, createUserAccount);
router.post("/signin", authenticateUser);
router.post("/signout", signOutUser);

//profile routes
router.get("/profile", isAuthenticated, getCurrentUserProfile);
router.patch("/profile", isAuthenticated, upload.single("avatar"), updateUserProfile);
router.delete("/delete-account", isAuthenticated, deleteUserAccount);

//password-management
router.patch("/change-password", isAuthenticated, changeUserPassword);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

export default router;