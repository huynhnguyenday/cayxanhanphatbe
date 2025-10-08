import express from "express";
import {
  changePassword,
  login,
  logout,
  resetPassword,
  forgotPassword,
  verifyOTP,
  sendOTP,
} from "../controllers/loginForm.controller.js";
import { protect } from "../middleware/protect.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/reset-password", resetPassword);
router.post("/change-password", protect, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/send-otp", sendOTP);

export default router;
