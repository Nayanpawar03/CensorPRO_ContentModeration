import express from "express";
import { registerUser, loginUser, logoutUser, googleLogin } from "../controllers/authController.js";

const router = express.Router();

// Manual auth
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

// Google auth
router.post("/google", googleLogin);

export default router;
