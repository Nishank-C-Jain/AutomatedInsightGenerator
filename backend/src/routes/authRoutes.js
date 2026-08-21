import express from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { registerLimiter, loginLimiter, refreshLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);

export default router;
