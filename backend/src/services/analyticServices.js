import axios from 'axios';
import path from 'path';
import pool from '../config/db.js';
import { env } from '../config/env.js';
import AnalysisResultModel from '../models/analysisResultModel.js';

/**
 * AnalyticServices
 *
 * Single-call bridge between Node.js and the Python FastAPI analytics engine.
 *
 * Flow:
 *   Node receives dataset_id  →  look up storage_path in DB
 *     →  POST /api/analysis/path on Python (file_path + dataset_id)
 *       →  Python runs all 9 analyzers in one call
 *       →  Python saves analysis_results JSONB to datasets table
 *     ←  Node receives { analysis } from Python
 *   Node inserts structured insights + anomaly rows
 *   Returns the full combined analysis to the caller
 */
class AnalyticServices {

  /**
   * Run the full analytics pipeline for an already-uploaded dataset.
   *
   * @param {string} datasetId  - UUID of the datasets row
   * @param {string} userId     - UUID of the owning user (for insight/anomaly rows)
   * @returns {Promise<object>} - The complete analysis object from Python
   */
  async runAnalysis(datasetId, userId) {

    // ── 1. Fetch the dataset row so we know the file path ──────────────── //
    const datasetResult = await pool.query(
      `SELECT id, storage_path, status FROM datasets WHERE id = $1 AND user_id = $2`,
      [datasetId, userId]
    );

    if (datasetResult.rows.length === 0) {
      const err = new Error('Dataset not found');
      err.statusCode = 404;
      throw err;
    }

    const dataset = datasetResult.rows[0];

    // ── 2. Mark dataset as processing ─────────────────────────────────── //
    await AnalysisResultModel.setProcessing(datasetId);

    // ── 3. Call Python analytics engine — one request, all 9 analyzers ── //
    let analysis;
    try {
      const pythonUrl = env.PYTHON_API_URL || 'http://127.0.0.1:8000';

      const response = await axios.post(
        `${pythonUrl}/api/analysis/path`,
        {
          // Resolve to absolute path — Python needs a full filesystem path
          file_path: path.resolve(dataset.storage_path),
          dataset_id: datasetId,
        },
        { timeout: 120_000 }
      );

      // Response envelope from Python:
      // { success, row_count, column_count, saved_to_db, analysis }
      analysis = response.data.analysis;

      if (!analysis) {
        throw new Error('Python service returned an empty analysis');
      }

    } catch (err) {
      // Mark dataset as failed and re-throw so the controller can respond
      await AnalysisResultModel.setFailed(datasetId);

      const error = new Error(
        err.response?.data?.detail || err.message || 'Python analytics service error'
      );
      error.statusCode = err.response?.status || 502;
      throw error;
    }

    // ── 4. Persist structured rows in a transaction ────────────────────── //
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 4a. Save analysis result + confirm status = 'analyzed' via model
      await AnalysisResultModel.save(datasetId, analysis);

      // 4b. Clear any previous insights for this dataset before re-inserting
      await client.query(`DELETE FROM insights WHERE dataset_id = $1`, [datasetId]);

      // 4c. Insert insight rows  (analysis.insights is a string[])
      if (Array.isArray(analysis.insights)) {
        for (let i = 0; i < analysis.insights.length; i++) {
          const text = analysis.insights[i];
          const summary = text.length > 50 ? text.substring(0, 50) + '...' : text;

          await client.query(
            `INSERT INTO insights
               (dataset_id, user_id, title, summary, content, insight_type)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              datasetId,
              userId,
              `Insight #${i + 1}`,
              summary,
              JSON.stringify({ text }),
              'summary',
            ]
          );
        }
      }

      // 4d. Clear previous anomaly rows before re-inserting
      await client.query(`DELETE FROM anomalies WHERE dataset_id = $1`, [datasetId]);

      // 4e. Insert anomaly rows — map to actual anomalies table schema:
      //     anomaly_type, anomaly_value, severity, details (JSONB)
      // analysis.anomalies = { colName: { anomaly_count, anomaly_percentage, detected_values, ... } }
      const anomaliesMap = analysis.anomalies;
      if (anomaliesMap && typeof anomaliesMap === 'object' && !anomaliesMap.message) {
        for (const [colName, anom] of Object.entries(anomaliesMap)) {
          if (anom && anom.anomaly_count > 0) {
            // Derive a human-readable severity from anomaly percentage
            const pct = anom.anomaly_percentage ?? 0;
            const severity = pct > 0.1 ? 'high' : pct > 0.05 ? 'medium' : 'low';

            await client.query(
              `INSERT INTO anomalies
                 (dataset_id, user_id, column_name, anomaly_type, anomaly_value, severity, details)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                datasetId,
                userId,
                colName,
                'zscore_outlier',
                String(anom.anomaly_count),   // number of anomalous rows
                severity,
                JSON.stringify({
                  anomaly_count:      anom.anomaly_count,
                  anomaly_percentage: anom.anomaly_percentage,
                  detected_indices:   anom.detected_indices,
                  detected_values:    anom.detected_values,
                  mean:               anom.mean,
                  std:                anom.std,
                }),
              ]
            );
          }
        }
      }


      await client.query('COMMIT');
      console.log(`[AnalyticServices] Dataset ${datasetId} analyzed ✓`);

    } catch (dbErr) {
      await client.query('ROLLBACK');
      console.error(`[AnalyticServices] DB error for dataset ${datasetId}:`, dbErr.message);
      // Don't throw — analysis succeeded; DB rows are a bonus
    } finally {
      client.release();
    }

    // ── 5. Return the full combined analysis ───────────────────────────── //
    return analysis;
  }

  /**
   * Fetch the stored analysis result for a dataset directly from the DB.
   * Returns null if analysis has not been run yet.
   *
   * @param {string} datasetId
   * @param {string} userId
   * @returns {Promise<object|null>}
   */
  async getAnalysisResult(datasetId, userId) {
    const row = await AnalysisResultModel.findByDatasetId(datasetId, userId);
    return {
      status: row.status,
      analysis: row.analysis_results ?? null,
    };
  }
}

export default new AnalyticServices();
