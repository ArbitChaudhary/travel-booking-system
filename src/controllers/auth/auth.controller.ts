import type { Request, Response } from "express";
import { prisma } from "../../../lib/prisma";
import { compareHash, hashData } from "../../lib/hash";
import { generateOTP } from "../../lib/generateOTP";
import { sendMail } from "../../lib/sendMail";
import jwt from "jsonwebtoken";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      select: { email: true, id: true },
    });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await hashData(password! as string);
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });
    const { password: _, ...userWithoutPassword } = newUser;
    const otp = generateOTP();
    const hashedOTP = await hashData(otp);
    await prisma.user.update({
      where: { id: newUser.id },
      data: {
        otp: hashedOTP,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendMail({
      to: email,
      subject: "Verify your email",
      text: `Your OTP is ${otp}`,
    });
    return res.status(201).json({
      message: "Verify your email with the OTP sent to your email address",
    });
  } catch (error) {
    console.log("Error in register controller:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or OTP" });
    }
    if (user.otpExpiry! < new Date(Date.now())) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    const isValidOTP = await compareHash(otp, user?.otp!);
    if (!isValidOTP) {
      return res.status(400).json({ message: "Invalid email or OTP" });
    }
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
      },
    });
    const { password: _, ...safeUser } = updatedUser;
    const access_token = jwt.sign(
      { userId: user.id, email: user.email, role: user?.role! },
      process.env.JWT_SECRET_KEY!,
      { expiresIn: "7d" },
    );
    return res.status(200).json({
      message: "Welcome to the platform",
      access_token,
      user: safeUser,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    if (!user.isVerified) {
      const otp = generateOTP();
      const hashedOTP = await hashData(otp);
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          otp: hashedOTP,
          otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
      await sendMail({
        to: email,
        subject: "Verify your email",
        text: `Your OTP is ${otp}`,
      });
      const { password: _, otp: __, ...userData } = updatedUser;
      return res
        .status(400)
        .json({ message: "Please verify your email", user: userData });
    }
    const isPasswordValid = await compareHash(password, user?.password!);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const { password: _, ...safeUser } = user;
    const access_token = jwt.sign(
      { id: user.id, email: user.email, role: user?.role },
      process.env.JWT_SECRET_KEY! as string,
      { expiresIn: "7d" },
    );
    return res.status(200).json({
      message: "Login successful",
      access_token,
      user: safeUser,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "User with this email does not exist" });
    }
    const otp = generateOTP();
    const hashedOTP = await hashData(otp);
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        forgotPasswordOtp: hashedOTP,
        forgotPasswordOtpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    await sendMail({
      to: email,
      subject: "Reset your password",
      text: `Your OTP to reset password is ${otp}`,
    });
    return res.status(200).json({ message: "OTP sent to your email address" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, forgotPasswordOtp, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "User with this email does not exist" });
    }
    if (user?.forgotPasswordOtpExpiry! < new Date(Date.now())) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    const isValidOTP = await compareHash(
      forgotPasswordOtp,
      user?.forgotPasswordOtp!,
    );
    if (!isValidOTP) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    const hashedPassword = await hashData(password! as string);
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        forgotPasswordOtp: null,
        forgotPasswordOtpExpiry: null,
      },
    });
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "User with this email does not exist" });
    }
    const isCurrentPasswordValid = await compareHash(
      currentPassword,
      user?.password!,
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    const hashedNewPassword = await hashData(newPassword);
    await prisma.user.update({
      where: { email },
      data: { password: hashedNewPassword },
    });
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // Since we are using JWT for authentication, we cannot invalidate the token on the server side.
    // The client should simply delete the token on logout.
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};
