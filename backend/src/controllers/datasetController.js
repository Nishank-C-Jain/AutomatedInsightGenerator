import pool from '../config/db';

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
            mimetype,
            size,
            filename,
            path,
        } = req.file;

        const extension =
            originalname.split(".").pop().toLowerCase();

        const result = await pool.query(
            `
      INSERT INTO datasets
      (
        user_id,
        name,
        original_filename,
        file_type,
        file_size,
        storage_path
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
            [
                userId,
                originalname,
                originalname,
                extension,
                size,
                path,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Dataset uploaded successfully",
            dataset: result.rows[0],
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

module.exports = {
    uploadDataset,
    getDatasets,
};