import express from 'express'
import { signup, login, googleAuth, refreshTokenHandler } from '../controllers/authController'
const router = express.Router()
import { body } from 'express-validator'

// Define route handlers with explicit types
router.post('/signup' , [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('username').notEmpty().withMessage('Username is required'),
  
], signup)
router.post('/login' , [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
], login)
router.post('/google', googleAuth)
router.post("/refresh-token" , refreshTokenHandler); // Todo: add refresh token to cookies instead of sending it in the response

export default router
