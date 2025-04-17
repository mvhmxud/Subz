import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'subz', 
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'], // Allowed formats
    transformation: [{ width: 500, height: 500, crop: 'limit' }] // Optional transformations
  } as any 
});

// Configure Multer middleware
export const uploadMiddleware = multer({ storage: storage });