import express from "express";
import {
  changePassword,
  forgotPassword,
  login,
  register,
  resetPassword,
  verifyEmail,
} from "../controllers/auth/auth.controller";

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.patch("/update-password", changePassword);

export default router;
