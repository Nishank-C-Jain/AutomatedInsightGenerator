import datasetServices from '../services/datasetServices.js';
import path from 'path';

class DatasetController {
  /**
   * Handle Dataset File Upload
   */
  async uploadDataset(req, res, next) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No dataset file provided'
        });
      }

      // Read dataset name from request body or fallback to original filename (without extension)
      let name = req.body.name;
      if (!name) {
        const ext = path.extname(file.originalname);
        name = path.basename(file.originalname, ext);
      }

      // Save dataset and retrieve parsed metadata
      const dataset = await datasetServices.createDataset({
        userId: req.user.id,
        name: name,
        originalFilename: file.originalname,
        fileType: path.extname(file.originalname),
        fileSize: file.size,
        storagePath: file.path
      });

      res.status(201).json({
        success: true,
        message: 'Dataset uploaded and processed successfully',
        dataset
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all Datasets for Authenticated User
   */
  async getDatasets(req, res, next) {
    try {
      const userId = req.user.id;
      const datasets = await datasetServices.getDatasetsByUserId(userId);

      res.status(200).json({
        success: true,
        datasets
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new DatasetController();
