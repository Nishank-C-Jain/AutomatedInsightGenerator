import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// Get dashboard statistics (protected route)
router.get(
  '/',
  authMiddleware,
  dashboardController.getDashboardStats
);

export default router;
