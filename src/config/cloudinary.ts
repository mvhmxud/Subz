import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: async (req, file) => {
    let resource_type = "image";
    if (file.mimetype.startsWith("video/")) {
      resource_type = "video";
    }

    return {
      folder: "subz", // your folder name
      resource_type: resource_type, // "image" or "video"
      allowed_formats: ["jpg", "png", "jpeg", "gif", "webp", "mp4"], 
      transformation:
        resource_type === "image"
          ? [{ width: 500, height: 500, crop: "limit" }]
          : undefined, // only resize images
    };
  },
});

export const uploadMiddleware = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype === "video/mp4") {
      cb(null, true);
    } else {
      cb(new Error("Only images and mp4 videos are allowed!"));
    }
  },
});
