import jwt from 'jsonwebtoken'
import User from '../models/User'
import { Request, Response, NextFunction } from 'express'


export const AuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' })
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, secret) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password')

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    (req as any).user = user;
    next()
  } catch (err: any) {
    console.error('Auth middleware error:', err.message)
    return res.status(401).json({ message: 'Not authorized, token failed' })
  }
}
