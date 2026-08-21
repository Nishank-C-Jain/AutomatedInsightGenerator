import fs from 'fs';
import path from 'path';
import pool from '../config/db.js';

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
  async createDataset({ userId, name, originalFilename, fileType, fileSize, storagePath }) {
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
      'uploaded'
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
}

export default new DatasetServices();
