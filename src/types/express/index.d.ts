import { Request } from 'express';
import { Document } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: Document;
      file?: Express.Multer.File;
    }
  }
} 