import type { Request, Response } from "express";
import { prisma } from "../../../lib/prisma";

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.user!;
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password: _, ...safeUser } = user;
    return res.status(200).json({ user: safeUser });
  } catch (error: Error | unknown) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.user!;
    const { name, email } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email },
    });
    const { password: _, ...safeUser } = updatedUser;
    return res.status(200).json({ user: safeUser });
  } catch (error: Error | unknown) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const offset = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        skip: offset,
        take: limit,
        omit: { password: true },
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      }),
      prisma.user.count(),
    ]);
    return res.status(200).json({ users, totalUsers });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error,
    });
  }
};
