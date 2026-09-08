import pool from '../config/db.js';

/**
 * AnalysisResultModel
 *
 * Data-access layer for the `analysis_results` JSONB column on the
 * `datasets` table (added by migration 008).
 *
 * Keeps all raw SQL for analysis results in one place so controllers
 * and services never write queries directly.
 *
 * DB column layout (datasets table):
 *   id               UUID  PK
 *   user_id          UUID  FK → users
 *   status           VARCHAR(30)   'uploaded' | 'processing' | 'completed' | 'failed'
 *   analysis_results JSONB         { data_quality, statistics, correlations,
 *                                    kpis, trends, forecasting, anomalies,
 *                                    insights, recommendations }
 *   row_count        INTEGER
 *   column_count     INTEGER
 *   updated_at       TIMESTAMP
 */
class AnalysisResultModel {

  // ──────────────────────────────────────────────────────────────────────── //
  // WRITE                                                                    //
  // ──────────────────────────────────────────────────────────────────────── //

  /**
   * Persist a full analysis result to the datasets row.
   * Also updates row_count, column_count, and flips status to 'completed'.
   *
   * @param {string} datasetId
   * @param {object} analysis     - Combined result from analyze_dataset()
   * @param {number} rowCount
   * @param {number} columnCount
   * @returns {Promise<object>}   - The updated datasets row
   */
  async save(datasetId, analysis, rowCount = null, columnCount = null) {
    const result = await pool.query(
      `UPDATE datasets
       SET
         analysis_results = $1::jsonb,
         row_count        = COALESCE($2, row_count),
         column_count     = COALESCE($3, column_count),
         status           = 'completed',
         updated_at       = NOW()
       WHERE id = $4::uuid
       RETURNING id, status, row_count, column_count, analysis_results, updated_at`,
      [JSON.stringify(analysis), rowCount, columnCount, datasetId]
    );

    if (result.rows.length === 0) {
      const err = new Error(`Dataset '${datasetId}' not found`);
      err.statusCode = 404;
      throw err;
    }

    return result.rows[0];
  }

  /**
   * Clear the stored analysis result and reset status to 'uploaded'.
   * Useful when re-uploading a corrected file.
   *
   * @param {string} datasetId
   * @returns {Promise<void>}
   */
  async clear(datasetId) {
    await pool.query(
      `UPDATE datasets
       SET analysis_results = NULL,
           status           = 'uploaded',
           updated_at       = NOW()
       WHERE id = $1::uuid`,
      [datasetId]
    );
  }

  /**
   * Mark a dataset as currently processing.
   *
   * @param {string} datasetId
   * @returns {Promise<void>}
   */
  async setProcessing(datasetId) {
    await pool.query(
      `UPDATE datasets
       SET status     = 'processing',
           updated_at = NOW()
       WHERE id = $1::uuid`,
      [datasetId]
    );
  }

  /**
   * Mark a dataset as failed.
   *
   * @param {string} datasetId
   * @returns {Promise<void>}
   */
  async setFailed(datasetId) {
    await pool.query(
      `UPDATE datasets
       SET status     = 'failed',
           updated_at = NOW()
       WHERE id = $1::uuid`,
      [datasetId]
    );
  }

  // ──────────────────────────────────────────────────────────────────────── //
  // READ                                                                     //
  // ──────────────────────────────────────────────────────────────────────── //

  /**
   * Fetch the full analysis result for a dataset.
   *
   * @param {string} datasetId
   * @param {string} userId     - Ownership check
   * @returns {Promise<{
   *   id:               string,
   *   status:           string,
   *   row_count:        number|null,
   *   column_count:     number|null,
   *   analysis_results: object|null,
   *   updated_at:       string
   * }>}
   */
  async findByDatasetId(datasetId, userId) {
    const result = await pool.query(
      `SELECT
         id,
         status,
         row_count,
         column_count,
         analysis_results,
         updated_at
       FROM datasets
       WHERE id = $1::uuid AND user_id = $2::uuid`,
      [datasetId, userId]
    );

    if (result.rows.length === 0) {
      const err = new Error('Dataset not found');
      err.statusCode = 404;
      throw err;
    }

    return result.rows[0];
  }

  /**
   * Return only a specific top-level section of the analysis result.
   * Avoids deserializing the whole JSONB when only one section is needed.
   *
   * @param {string} datasetId
   * @param {string} userId
   * @param {'data_quality'|'statistics'|'correlations'|'kpis'|
   *          'trends'|'forecasting'|'anomalies'|'insights'|'recommendations'} section
   * @returns {Promise<object|null>}
   */
  async findSection(datasetId, userId, section) {
    const ALLOWED_SECTIONS = new Set([
      'data_quality', 'statistics', 'correlations', 'kpis',
      'trends', 'forecasting', 'anomalies', 'insights', 'recommendations',
    ]);

    if (!ALLOWED_SECTIONS.has(section)) {
      const err = new Error(`Unknown analysis section: '${section}'`);
      err.statusCode = 400;
      throw err;
    }

    // Use the JSONB -> key operator to pull only the requested section
    const result = await pool.query(
      `SELECT analysis_results -> $1 AS section
       FROM datasets
       WHERE id = $2::uuid AND user_id = $3::uuid`,
      [section, datasetId, userId]
    );

    if (result.rows.length === 0) {
      const err = new Error('Dataset not found');
      err.statusCode = 404;
      throw err;
    }

    return result.rows[0].section ?? null;
  }

  /**
   * Check whether a full analysis result is already stored.
   *
   * @param {string} datasetId
   * @returns {Promise<boolean>}
   */
  async exists(datasetId) {
    const result = await pool.query(
      `SELECT 1 FROM datasets
       WHERE id = $1::uuid
         AND analysis_results IS NOT NULL
         AND status = 'completed'`,
      [datasetId]
    );
    return result.rows.length > 0;
  }
}

export default new AnalysisResultModel();
