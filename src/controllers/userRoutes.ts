import User from "../models/User";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import { generateAccessToken } from "../utils/generateTokens";

// Extend Request type to include file
interface RequestWithFile extends Request {
  file?: any; // Using any temporarily until we properly set up multer types
}

export const getUser = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      username: user.username,
      name: user.name,
      image: user.image,
      onboarding: user.onboarding,
      bio: user.bio,
    });
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const token = req.cookies.token;
  const { username, name, image, onboarding, bio, password } = req.body;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(decoded.userId, {
      username,
      name,
      image,
      onboarding,
      bio,
      ...(hashedPassword && { password: hashedPassword }),
    });

    const updatedToken = generateAccessToken(
      user._id,
      user.username,
      user.name,
      user.image,
      user.onboarding,
      user.bio
    );
    res.clearCookie("token");
    res.cookie("token", updatedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const uploadImage = async (req: RequestWithFile, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const imageUrl = req.file.path;
    const updatedUser = await User.findByIdAndUpdate(user._id, {
      image: imageUrl,
    });
    const updatedToken = generateAccessToken(
      updatedUser._id,
      updatedUser.username,
      updatedUser.name,
      imageUrl,
      updatedUser.onboarding,
      updatedUser.bio
    );
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie("token", updatedToken);
    return res
      .status(200)
      .json({ message: "Image uploaded successfully", imageUrl });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error uploading image",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
