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
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
