import express from "express";
import {
  addFriend,
  getUser,
  updateUser,
  uploadImage,
  acceptFriendRequest,
  sendFriendRequest,
  getRelations,
  rejectFriendRequest,
  deleteFriend,
  searchUsers,
} from "../controllers/useController";
import { body } from "express-validator";
import { uploadMiddleware } from "../config/cloudinary";
const router = express.Router();

// USER
router.get("/user", getUser);
router.get("/search", searchUsers) ;
router.put(
  "/user",
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .optional(),
  body("username")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long")
    .optional(),
  body("email").isEmail().withMessage("Invalid email address").optional(),
  updateUser
);

router.post(
  "/user/update-image",
  uploadMiddleware.single("image"),
  uploadImage
);

// FRIEND REQUESTS
router.post("/user/add-friend", addFriend);
router.get("/user/relations", getRelations);
router.post("/user/friend-request", sendFriendRequest);
router.put("/user/accept-friend-request", acceptFriendRequest);
router.put("/user/reject-friend-request", rejectFriendRequest);
router.delete("/user/friend", deleteFriend);

export default router;
