import jwt from "jsonwebtoken";
import User from "../models/User";
import { Request, Response, NextFunction } from "express";
import { Document } from "mongoose";

// Define the JWT payload type
interface JWTPayload {
  userId: string;
  [key: string]: any;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: Document;
    }
  }
}

export const AuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Server configuration error" });
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    if (!decoded.userId) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error instanceof Error ? error.message : "Unknown error");
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};
