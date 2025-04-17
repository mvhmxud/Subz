import express from "express";
import { getUser, updateUser, uploadImage } from "../controllers/userRoutes";
import { body } from "express-validator";
import { uploadMiddleware } from "../config/cloudinary";
const router = express.Router();

router.get("/user", getUser);
// check if password > 8 characters and username is > 3 characters and email is valid all are optional
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

router.post('/user/update-image', uploadMiddleware.single('image'), uploadImage);
export default router;
