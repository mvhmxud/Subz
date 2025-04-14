import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens";
import { generateUsername } from "../utils/generateUsername";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateAuthTokens = async (user: any) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Store only the current refresh token (invalidate previous ones)
  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

// Signup with email/password
export const signup = async (req: Request, res: Response) => {
  console.log("singing up ...");
  const { email, password, name, username } = req.body;

  try {
    // Check if email exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Check if username exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // Create new user
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashed,
      name,
      username,
      emailVerified: false, // Set email as unverified initially
    });

    // Generate auth tokens
    const { accessToken, refreshToken } = await generateAuthTokens(user);

    // Set cookies
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // TODO: In a real implementation, send verification email here

    res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        emailVerified: user.emailVerified,
        image: user.image,
      },
    });
  } catch (err: any) {
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Invalid input data", details: err.message });
    }
    res.status(500).json({ message: "Server error during signup", err: err });
  }
};

// Login with email/password
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Account not found" });
    }

    // Check if account was created with Google
    if (!user.password) {
      return res.status(400).json({
        message:
          "This account uses Google authentication. Please sign in with Google.",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Generate auth tokens
    const { accessToken, refreshToken } = await generateAuthTokens(user);

    // Set cookies
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        emailVerified: user.emailVerified,
        image: user.image,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: "Server error during login" });
  }
};

// Google OAuth Login
export const googleAuth = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  try {
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: "Invalid token payload" });
    }

    const {
      email,
      name,
      picture,
      sub: googleId,
      email_verified,
    } = payload as {
      email: string;
      name: string;
      picture: string;
      sub: string;
      email_verified: boolean;
    };

    // Check if this Google account is already registered
    let user = await User.findOne({ googleId });

    // If no user with this Google ID, check if email exists
    if (!user) {
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        // If the user exists with password auth, link the Google account
        if (existingUser.password) {
          existingUser.googleId = googleId;
          existingUser.image = existingUser.image || picture;
          existingUser.emailVerified = true; // Google emails are verified
          user = existingUser;
          await user.save();
        } else {
          // Another OAuth account with same email - security issue
          return res.status(400).json({
            message: "An account with this email already exists",
          });
        }
      } else {
        // Create new user with Google account
        user = await User.create({
          email,
          name,
          image: picture,
          googleId,
          username: await generateUniqueUsername(name),
          emailVerified: Boolean(email_verified),
        });
      }
    }

    // Generate auth tokens
    const { accessToken, refreshToken } = await generateAuthTokens(user);

    // Set cookies
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        emailVerified: user.emailVerified,
        image: user.image,
      },
    });
  } catch (err: any) {
    console.error("Google auth error:", err);
    if (err.message === "invalid_token") {
      return res.status(401).json({ message: "Invalid Google token" });
    }
    res.status(500).json({ message: "Google authentication failed" });
  }
};

// Helper function to generate unique username
async function generateUniqueUsername(name: string): Promise<string> {
  let username = generateUsername(name);
  let exists = await User.findOne({ username });

  // If username exists, append random numbers until unique
  while (exists) {
    const randomSuffix = Math.floor(Math.random() * 10000);
    username = `${generateUsername(name)}${randomSuffix}`;
    exists = await User.findOne({ username });
  }

  return username;
}

// Logout route
export const logout = async (req: Request, res: Response) => {
  try {
    // Clear cookies
    res.clearCookie("token");
    res.clearCookie("refreshToken");

    // If you have user info in the request, you could also invalidate their refresh token
    const userId = (req as any).user?._id;
    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshToken: null });
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error during logout" });
  }
};

// Refresh token handler
export const refreshTokenHandler = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET as string
    ) as JwtPayload;

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAuthTokens(user);

    // Set new cookies
    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        emailVerified: user.emailVerified,
        image: user.image,
      },
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Refresh token expired" });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    res.status(500).json({ message: "Internal server error during token refresh" });
  }
};
