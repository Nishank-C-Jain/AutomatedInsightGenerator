import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import datasetController from '../controllers/datasetController.js';

const router = express.Router();

// Upload dataset (protected route, requires 'file' field in multipart form-data)
router.post(
  '/upload',
  authMiddleware,
  upload.single('file'),
  datasetController.uploadDataset
);

// Get datasets (protected route)
router.get(
  '/',
  authMiddleware,
  datasetController.getDatasets
);

// Get specific dataset by ID (protected route)
router.get(
  '/:id',
  authMiddleware,
  datasetController.getDatasetById
);

// Get dataset row preview + column metadata (protected route)
router.get(
  '/:id/preview',
  authMiddleware,
  datasetController.getDatasetPreview
);

export default router;
