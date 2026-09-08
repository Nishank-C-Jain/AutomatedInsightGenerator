import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
  async createDataset({ userId, name, originalFilename, fileType, fileSize, storagePath, status = 'uploaded' }) {
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
  /**
   * Process dataset asynchronously:
   *   1. POST file_path + dataset_id to Python analytics service
   *   2. Python runs all 9 analyzers and saves analysis_results to DB
   *   3. Node then inserts structured insights & anomalies rows
   */
  async processDataset(datasetId, userId, filePath) {
    const pythonApiUrl = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

    // Resolve to absolute path — Python needs a full filesystem path
    const absoluteFilePath = path.resolve(filePath);

    try {
      console.log(`[Dataset ${datasetId}] Calling Python analytics service...`);
      console.log(`[Dataset ${datasetId}] File path: ${absoluteFilePath}`);

      // POST to the new /api/analysis/path endpoint
      // Python will run all analyzers AND save analysis_results to datasets table
      const response = await axios.post(
        `${pythonApiUrl}/api/analysis/path`,
        {
          file_path: absoluteFilePath,
          dataset_id: datasetId,   // tells Python to persist to DB itself
        },
        { timeout: 120_000 }        // 2-minute timeout for large files
      );

      // Response envelope: { success, row_count, column_count, saved_to_db, analysis }
      const { analysis } = response.data;

      if (!analysis) {
        throw new Error('Python service returned no analysis data');
      }

      // Begin a transaction to insert structured insights & anomalies rows
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // 1. Mark dataset as 'analyzed' (Python may have already set this,
        //    but we confirm from Node side too)
        await client.query(
          `UPDATE datasets SET status = 'completed', updated_at = NOW() WHERE id = $1`,
          [datasetId]
        );

        // 2. Insert insights rows (analysis.insights is a string[]) 
        if (Array.isArray(analysis.insights)) {
          for (let i = 0; i < analysis.insights.length; i++) {
            const insightText = analysis.insights[i];
            const summary = insightText.length > 50
              ? insightText.substring(0, 50) + '...'
              : insightText;

            await client.query(
              `INSERT INTO insights (dataset_id, user_id, title, summary, content, insight_type)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                datasetId,
                userId,
                `Insight #${i + 1}`,
                summary,
                JSON.stringify({ text: insightText }),
                'summary',
              ]
            );
          }
        }

        // 3. Insert anomalies rows
        // analysis.anomalies is now a per-column dict: { colName: { anomaly_count, ... } }
        // DB schema: anomaly_type, anomaly_value (count as string), severity, details (JSONB)
        const anomaliesMap = analysis.anomalies;
        if (anomaliesMap && typeof anomaliesMap === 'object' && !anomaliesMap.message) {
          for (const [colName, anom] of Object.entries(anomaliesMap)) {
            if (anom && anom.anomaly_count > 0) {
              const pct = anom.anomaly_percentage ?? 0;
              const severity = pct > 10 ? 'high' : pct > 5 ? 'medium' : 'low';
              await client.query(
                `INSERT INTO anomalies
                   (dataset_id, user_id, column_name, anomaly_type, anomaly_value, severity, details)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  datasetId,
                  userId,
                  colName,
                  'zscore_outlier',
                  String(anom.anomaly_count),   // count stored as text in anomaly_value
                  severity,
                  JSON.stringify({
                    anomaly_count:      anom.anomaly_count,
                    anomaly_percentage: anom.anomaly_percentage,
                    detected_indices:   anom.detected_indices,
                    detected_values:    anom.detected_values,
                  }),
                ]
              );
            }
          }
        }


        await client.query('COMMIT');
        console.log(`[Dataset ${datasetId}] Processing complete ✓`);

      } catch (dbError) {
        await client.query('ROLLBACK');
        throw dbError;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error(`[Dataset ${datasetId}] Auto-analysis failed:`, error.message);

      // Set status back to 'uploaded' — the file is intact, analysis can be
      // triggered manually from the Analytics tab.
      await pool.query(
        `UPDATE datasets SET status = 'uploaded', updated_at = NOW() WHERE id = $1`,
        [datasetId]
      );
    }
  }
}

export default new DatasetServices();
