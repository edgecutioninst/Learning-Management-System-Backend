import {
    authenticateUser,
    createUserAccount,
    getCurrentUserProfile,
    signOutUser,
    updateUserProfile
} from '../controllers/user.controller.js';
import express from 'express';
import { upload } from '../utils/multer.js'
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { validateSignUp } from '../middlewares/validation.middleware.js';

const router = express.Router();


//auth routes:
router.post("/signup", validateSignUp, createUserAccount)
    .post("/signin", authenticateUser)
    .post("/signout", signOutUser)


//profile routes:
router.get("/profile", isAuthenticated, getCurrentUserProfile)
    .patch("/profile", isAuthenticated, upload.single("avatar"), updateUserProfile)



export default router;