import User, { IUser } from "../models/User";
import { HydratedDocument, Types } from "mongoose";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import { generateAccessToken } from "../utils/generateTokens";

// GET USER : GET /users/user
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

//search user : GET /users/user/search : PARAMS : username
export const searchUsers = async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || typeof q !== "string") {
    return res.status(400).json({ message: "Missing search query" });
  }

  const results = await User.find({
    username: { $regex: `^${q}`, $options: "i" },
  })
    .limit(10)
    .select("_id username name image");

  return res.status(200).json({ users: results });
};

// UPDATE USER : POST /users/user/update : PARAMS : username, name, image, onboarding, bio, password
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

// UPLOAD IMAGE : POST /users/user/update-image : PARAMS : image
export const uploadImage = async (req: Request, res: Response) => {
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

// ADD FRIEND : POST /users/user/add-friend : PARAMS : friendId
export const addFriend = async (req: Request, res: Response) => {
  const { friendId } = req.body;

  // Auth check
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Validate friendId
  if (!Types.ObjectId.isValid(friendId)) {
    return res.status(400).json({ message: "Invalid friend ID" });
  }

  const user = req.user;

  const userDoc: HydratedDocument<IUser> | null = await User.findById(user._id);
  if (!userDoc) {
    return res.status(404).json({ message: "User not found" });
  }
  // check if friendId === user._id
  if (friendId === userDoc._id) {
    return res
      .status(400)
      .json({ message: "You cannot add yourself as a friend" });
  }

  const friend: HydratedDocument<IUser> | null = await User.findById(friendId);
  if (!friend) {
    return res.status(404).json({ message: "Friend not found" });
  }

  // Check if already friends
  if (userDoc.friends.includes(friendId)) {
    return res.status(400).json({ message: "Already friends" });
  }

  // Add friend both ways (optional: depending on your logic)
  try {
    userDoc.friends.push(friendId);
    friend.friends.push(userDoc._id);

    await userDoc.save();
    await friend.save();

    return res
      .status(200)
      .json({ message: "Friend added", friends: userDoc.friends });
  } catch (error) {
    return res.status(500).json({ message: "Error adding friend" });
  }
};

// GET FRIEND REQUESTS : Post /users/user/friend-requests : PARAMS : userId
export const sendFriendRequest = async (req: Request, res: Response) => {
  const { friendId } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user;

  if (!Types.ObjectId.isValid(friendId)) {
    return res.status(400).json({ message: "Invalid friend ID" });
  }

  const userDoc: HydratedDocument<IUser> | null = await User.findById(user._id);
  const friend: HydratedDocument<IUser> | null = await User.findById(friendId);

  if (!userDoc || !friend) {
    return res.status(404).json({ message: "User or Friend not found" });
  }

  if (friendId === userDoc._id.toString()) {
    return res
      .status(400)
      .json({ message: "You cannot add yourself as a friend" });
  }

  if (userDoc.friends.includes(friend._id)) {
    return res.status(400).json({ message: "Already friends" });
  }

  // Check if a friend request was already sent
  const alreadySent = userDoc.friendRequests.some(
    (req) => req.userId.toString() === friendId && req.type === "sent"
  );

  if (alreadySent) {
    return res.status(400).json({ message: "Friend request already sent" });
  }

  // Optional: Check if friend already sent a request (mutual pending)
  const mutualRequest = userDoc.friendRequests.some(
    (req) => req.userId.toString() === friendId && req.type === "received"
  );

  if (mutualRequest) {
    return res.status(400).json({ message: "They already sent you a request" });
  }

  try {
    userDoc.friendRequests.push({ userId: friend._id, type: "sent" });
    friend.friendRequests.push({ userId: userDoc._id, type: "received" });

    await userDoc.save();
    await friend.save();

    return res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    return res.status(500).json({ message: "Error sending friend request" });
  }
};

// ACCEPT FRIEND REQUEST : POST /users/user/accept-friend-request : PARAMS : requestId
export const acceptFriendRequest = async (req: Request, res: Response) => {
  const { requestId } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!Types.ObjectId.isValid(requestId)) {
    return res.status(400).json({ message: "Invalid request ID" });
  }

  const user = req.user;
  const userDoc: HydratedDocument<IUser> | null = await User.findById(user._id);
  const friend: HydratedDocument<IUser> | null = await User.findById(requestId);

  if (!userDoc || !friend) {
    return res.status(404).json({ message: "User or Friend not found" });
  }

  const hasReceivedRequest = userDoc.friendRequests.some(
    (req) => req.userId.toString() === requestId && req.type === "received"
  );

  if (!hasReceivedRequest) {
    return res
      .status(400)
      .json({ message: "No friend request received from this user" });
  }

  try {
    // Add to friends list (both sides)
    if (!userDoc.friends.includes(friend._id)) userDoc.friends.push(friend._id);
    if (!friend.friends.includes(userDoc._id)) friend.friends.push(userDoc._id);

    // Remove friendRequests from both users
    userDoc.friendRequests = userDoc.friendRequests.filter(
      (req) => req.userId.toString() !== requestId
    );

    friend.friendRequests = friend.friendRequests.filter(
      (req) => req.userId.toString() !== userDoc._id.toString()
    );

    await userDoc.save();
    await friend.save();

    return res.status(200).json({
      message: "Friend request accepted",
      friend: friend,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error accepting friend request" });
  }
};

// REJECT FRIEND REQUEST : PUT /users/user/reject-friend-request : PARAMS : requestId
export const rejectFriendRequest = async (req: Request, res: Response) => {
  const { requestId } = req.body;

  const user = req.user;
  const userDoc: HydratedDocument<IUser> | null = await User.findById(
    user?._id
  );
  const friend: HydratedDocument<IUser> | null = await User.findById(requestId);
  if (!userDoc || !friend) {
    return res.status(404).json({ message: "User or Friend not found" });
  }
  const hasReceivedRequest = userDoc.friendRequests.some(
    (req) => req.userId.toString() === requestId && req.type === "received"
  );
  if (!hasReceivedRequest) {
    return res
      .status(400)
      .json({ message: "No friend request received from this user" });
  }
  try {
    userDoc.friendRequests = userDoc.friendRequests.filter(
      (req) => req.userId.toString() !== requestId
    );
    friend.friendRequests = friend.friendRequests.filter(
      (req) => req.userId.toString() !== userDoc._id.toString()
    );
    await userDoc.save();
    await friend.save();
    return res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    return res.status(500).json({ message: "Error rejecting friend request" });
  }
};

// GET RELATIONS : GET /users/user/relations : PARAMS : userId
export const getRelations = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user?._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userDoc: HydratedDocument<IUser> | null = await User.findById(user._id);

  if (!userDoc) {
    return res.status(404).json({ message: "User not found" });
  }

  // Fetch friends
  const friends = await User.find({ _id: { $in: userDoc.friends } }).select(
    "-password -email -onboarding -refreshToken -friends -createdAt -friendRequests"
  );

  // Fetch friend requests (only received ones)
  const receivedRequests = userDoc.friendRequests.filter(
    (req) => req.type === "received"
  );

  const friendRequests = await User.find({
    _id: { $in: receivedRequests.map((req) => req.userId) },
  }).select("_id username name image");

  return res.status(200).json({ friends, friendRequests });
};

// delete friend : DELETE /users/user/friend : PARAMS : friendId
export const deleteFriend = async (req: Request, res: Response) => {
  const { friendId } = req.body;
  const user = req.user;

  if (!user?._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!Types.ObjectId.isValid(friendId)) {
    return res.status(400).json({ message: "Invalid friend ID" });
  }

  const userDoc: HydratedDocument<IUser> | null = await User.findById(user._id);
  const friendDoc: HydratedDocument<IUser> | null =
    await User.findById(friendId);

  if (!userDoc || !friendDoc) {
    return res.status(404).json({ message: "User or friend not found" });
  }

  if (!userDoc.friends.includes(friendId)) {
    return res
      .status(400)
      .json({ message: "You are not friends with this user" });
  }

  // Remove each other from friends lists
  userDoc.friends = userDoc.friends.filter((id) => id.toString() !== friendId);
  friendDoc.friends = friendDoc.friends.filter(
    (id) => id.toString() !== userDoc._id.toString()
  );

  await userDoc.save();
  await friendDoc.save();

  return res.status(200).json({ message: "Friend deleted" });
};
