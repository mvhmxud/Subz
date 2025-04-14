import express from 'express'
import { signup, login, googleAuth, refreshTokenHandler } from '../controllers/authController'
const router = express.Router()

// Define route handlers with explicit types
router.post('/signup', signup)
router.post('/login', login)
router.post('/google', googleAuth)
router.post("/refresh-token", refreshTokenHandler);

export default router
