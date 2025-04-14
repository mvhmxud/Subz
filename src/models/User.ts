import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // null for Google users
  name: { type: String },
  image: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
  refreshToken: { type: String, default: null }
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
