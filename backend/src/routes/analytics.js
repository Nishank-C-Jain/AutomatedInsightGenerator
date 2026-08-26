import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import analyticsController from '../controllers/analyticsController.js';

const router = express.Router();

/**
 * POST /api/analytics/:datasetId/run
 * Trigger full analysis on an uploaded dataset.
 * Node calls Python, Python runs all 9 analyzers in one request,
 * saves results to PostgreSQL, Node inserts insight + anomaly rows.
 */
router.post(
  '/:datasetId/run',
  authMiddleware,
  analyticsController.runAnalysis
);

/**
 * GET /api/analytics/:datasetId
 * Fetch the stored analysis result from the DB (no Python call).
 */
router.get(
  '/:datasetId',
  authMiddleware,
  analyticsController.getAnalysis
);

export default router;
