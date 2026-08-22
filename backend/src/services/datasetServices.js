import fs from 'fs';
import path from 'path';
import pool from '../config/db.js';
import axios from 'axios';

class DatasetServices {
  /**
   * Parse CSV/JSON files to retrieve row and column counts
   * @param {string} filePath - Absolute path to the file
   * @param {string} fileType - 'csv' or 'json'
   * @returns {Object} { rowCount, columnCount }
   */
  parseFileMetadata(filePath, fileType) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      if (fileType === 'csv') {
        const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length === 0) {
          return { rowCount: 0, columnCount: 0 };
        }

        // Count columns from the header row, respecting quoted values
        const header = lines[0];
        let columnCount = 0;
        let inQuotes = false;
        for (let i = 0; i < header.length; i++) {
          const char = header[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            columnCount++;
          }
        }
        columnCount += 1; // include the last column after the final comma

        // Row count is lines minus the header
        const rowCount = Math.max(0, lines.length - 1);
        return { rowCount, columnCount };

      } else if (fileType === 'json') {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const rowCount = parsed.length;
          const columnCount = rowCount > 0 && typeof parsed[0] === 'object' && parsed[0] !== null
            ? Object.keys(parsed[0]).length
            : 1;
          return { rowCount, columnCount };
        } else if (typeof parsed === 'object' && parsed !== null) {
          return {
            rowCount: 1,
            columnCount: Object.keys(parsed).length
          };
        } else {
          return { rowCount: 1, columnCount: 1 };
        }
      }

      return { rowCount: null, columnCount: null };
    } catch (error) {
      console.error(`Error parsing file metadata for path ${filePath}:`, error.message);
      // Fallback if parsing fails
      return { rowCount: null, columnCount: null };
    }
  }

  /**
   * Save dataset metadata to Database
   */
  async createDataset({ userId, name, originalFilename, fileType, fileSize, storagePath, status = 'processing' }) {
    // Determine the type: .csv -> csv, .json -> json, etc.
    let normalizedType = fileType.toLowerCase();
    if (normalizedType.startsWith('.')) {
      normalizedType = normalizedType.substring(1);
    }

    // Parse the file for row & column count metadata
    const { rowCount, columnCount } = this.parseFileMetadata(storagePath, normalizedType);

    // Insert into the datasets table
    const insertQuery = `
      INSERT INTO datasets (user_id, name, original_filename, file_type, file_size, storage_path, row_count, column_count, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, user_id, name, original_filename, file_type, file_size, row_count, column_count, status, created_at, updated_at
    `;

    const result = await pool.query(insertQuery, [
      userId,
      name,
      originalFilename,
      normalizedType,
      fileSize,
      storagePath,
      rowCount,
      columnCount,
      status
    ]);

    return result.rows[0];
  }

  /**
   * Get all datasets for a user
   */
  async getDatasetsByUserId(userId) {
    const query = `
      SELECT id, name, original_filename, file_type, file_size, row_count, column_count, status, created_at, updated_at
      FROM datasets
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Process dataset asynchronously by calling Python analytics engine
   */
  async processDataset(datasetId, userId, filePath) {
    try {
      console.log(`Starting processing for dataset ${datasetId}...`);
      
      const pythonApiUrl = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';
      const response = await axios.post(`${pythonApiUrl}/api/analyze`, {
        file_path: filePath
      });

      const analysisResults = response.data.analysis_results;

      // Begin a transaction to update dataset and insert insights/anomalies
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // 1. Update dataset with full analysis_results jsonb and status completed
        await client.query(
          `UPDATE datasets SET status = 'completed', analysis_results = $1 WHERE id = $2`,
          [JSON.stringify(analysisResults), datasetId]
        );

        // 2. Insert insights
        if (analysisResults.insights && Array.isArray(analysisResults.insights)) {
          for (let i = 0; i < analysisResults.insights.length; i++) {
            const insightText = analysisResults.insights[i];
            await client.query(
              `INSERT INTO insights (dataset_id, user_id, title, summary, content, insight_type)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                datasetId,
                userId,
                `Insight #${i+1}`,
                insightText.substring(0, 50) + '...',
                JSON.stringify({ text: insightText }),
                'summary'
              ]
            );
          }
        }

        // 3. Insert anomalies if present
        if (analysisResults.anomalies && analysisResults.anomalies.anomaly_count > 0) {
          const anom = analysisResults.anomalies;
          await client.query(
            `INSERT INTO anomalies (dataset_id, user_id, column_name, anomaly_count, anomaly_percentage, anomaly_data)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              datasetId,
              userId,
              anom.column,
              anom.anomaly_count,
              anom.anomaly_percentage,
              JSON.stringify({
                detected_indices: anom.detected_indices,
                detected_values: anom.detected_values
              })
            ]
          );
        }

        await client.query('COMMIT');
        console.log(`Processing complete for dataset ${datasetId}`);
      } catch (dbError) {
        await client.query('ROLLBACK');
        throw dbError;
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error(`Error processing dataset ${datasetId}:`, error.message);
      
      // Update status to failed
      await pool.query(
        `UPDATE datasets SET status = 'failed' WHERE id = $1`,
        [datasetId]
      );
    }
  }
}

export default new DatasetServices();
