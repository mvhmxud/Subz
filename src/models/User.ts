import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: null }, // null for Google users
  name: { type: String },
  image: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
  refreshToken: { type: String, default: null },
  bio: { type: String, default: "Hey, I'm new here! 🙋‍♂️✨" },
  onboarding: { type: Boolean, default: true },
  isActive: { type: Boolean, default: false },
  lastActive: { type: Date, default: null },
  
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  friendRequests: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      type: { type: String, enum: ["sent", "received"], required: true },
    },
  ],
});

export interface IUser {
  username: string;
  email: string;
  password: string;
  name: string;
  image: string;
  googleId: string;
  createdAt: Date;
  refreshToken: string;
  bio: string;
  onboarding: boolean;
  isActive: boolean;
  lastActive: Date;
  friends: mongoose.Types.ObjectId[];
  friendRequests: { userId: mongoose.Types.ObjectId; type: string }[];
}

export default mongoose.models.User || mongoose.model("User", UserSchema);
