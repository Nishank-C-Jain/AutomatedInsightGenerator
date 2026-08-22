import pool from '../config/db.js';
import datasetServices from '../services/datasetServices.js';

const uploadDataset = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a file",
            });
        }

        const userId = req.user.id;

        const {
            originalname,
            size,
            path,
        } = req.file;

        const extension = originalname.split(".").pop().toLowerCase();

        // 1. Create dataset entry with status = 'processing'
        const dataset = await datasetServices.createDataset({
            userId,
            name: originalname,
            originalFilename: originalname,
            fileType: extension,
            fileSize: size,
            storagePath: path,
            status: 'processing'
        });

        // 2. Trigger asynchronous processing
        // We do NOT await this so the client gets a quick response
        datasetServices.processDataset(dataset.id, userId, path).catch(err => {
            console.error("Error in async processDataset:", err);
        });

        // 3. Return response immediately
        return res.status(201).json({
            success: true,
            message: "Dataset uploaded successfully and is now processing",
            dataset: dataset,
        });

    } catch (error) {
        console.error("Dataset upload error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to upload dataset",
        });
    }
};

//Route: Get Dataset
const getDatasets = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(
            `
      SELECT
        id,
        name,
        original_filename,
        file_type,
        file_size,
        row_count,
        column_count,
        status,
        created_at,
        updated_at
      FROM datasets
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
            [userId]
        );

        return res.status(200).json({
            success: true,
            datasets: result.rows,
        });

    } catch (error) {
        console.error("Get datasets error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch datasets",
        });
    }
};


export default {
    uploadDataset,
    getDatasets,
};