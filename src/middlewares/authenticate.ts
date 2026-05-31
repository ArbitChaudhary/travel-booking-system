import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface UserBody {
  id: number;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserBody;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Here you would typically verify the token and extract user information
  try {
    const decoded = await jwt.verify(
      token,
      process.env.JWT_SECRET_KEY as string,
      (error, user) => {
        if (error) {
          return res.status(500).json({ message: "Unauthorized" });
        }
        req.user = user as UserBody;
        next();
      },
    );
  } catch (error) {
    return res.status(500).json({ error });
  }
};
