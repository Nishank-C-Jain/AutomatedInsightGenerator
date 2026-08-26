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

// Route: Get Single Dataset by ID (with insights and anomalies)
const getDatasetById = async (req, res) => {
    try {
        const userId = req.user.id;
        const datasetId = req.params.id;

        const datasetResult = await pool.query(
            `SELECT * FROM datasets WHERE id = $1 AND user_id = $2`,
            [datasetId, userId]
        );

        if (datasetResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Dataset not found" });
        }

        const dataset = datasetResult.rows[0];

        // Fetch related insights
        const insightsResult = await pool.query(
            `SELECT id, title, summary, content, insight_type FROM insights WHERE dataset_id = $1 ORDER BY created_at ASC`,
            [datasetId]
        );

        // Fetch related anomalies
        const anomaliesResult = await pool.query(
            `SELECT id, column_name, anomaly_count, anomaly_percentage, anomaly_data FROM anomalies WHERE dataset_id = $1`,
            [datasetId]
        );

        return res.status(200).json({
            success: true,
            dataset: {
                ...dataset,
                insights: insightsResult.rows,
                anomalies: anomaliesResult.rows
            }
        });

    } catch (error) {
        console.error("Get dataset by id error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch dataset details",
        });
    }
};

export default {
    uploadDataset,
    getDatasets,
    getDatasetById,
};