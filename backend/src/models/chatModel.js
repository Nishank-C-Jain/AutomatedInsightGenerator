import pool from '../config/db.js';

/**
 * ChatModel
 *
 * Data-access layer for the `chat_sessions` and `chat_messages` tables
 * created by migration 007.
 *
 * Table layout:
 *
 *   chat_sessions
 *     id         SERIAL PK
 *     user_id    UUID  FK → users
 *     dataset_id UUID  FK → datasets
 *     title      VARCHAR(255)
 *     created_at TIMESTAMPTZ
 *     updated_at TIMESTAMPTZ
 *
 *   chat_messages
 *     id         SERIAL PK
 *     session_id INTEGER FK → chat_sessions
 *     sender     VARCHAR(20)   'user' | 'ai'
 *     message    TEXT
 *     created_at TIMESTAMPTZ
 */
class ChatModel {

  // ──────────────────────────────────────────────────────────────────────── //
  // SESSIONS                                                                 //
  // ──────────────────────────────────────────────────────────────────────── //

  /**
   * Find the most-recently-updated session for a dataset, or create one.
   *
   * @param {string} datasetId
   * @param {string} userId
   * @returns {Promise<{ id: number, title: string, created_at: string, updated_at: string }>}
   */
  async findOrCreateSession(datasetId, userId) {
    // Try to find an existing session (most recent first)
    const existing = await pool.query(
      `SELECT id, title, created_at, updated_at
         FROM chat_sessions
        WHERE dataset_id = $1::uuid
          AND user_id    = $2::uuid
        ORDER BY updated_at DESC
        LIMIT 1`,
      [datasetId, userId]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    // Create a new session
    const created = await pool.query(
      `INSERT INTO chat_sessions (user_id, dataset_id, title)
       VALUES ($1::uuid, $2::uuid, 'New Chat')
       RETURNING id, title, created_at, updated_at`,
      [userId, datasetId]
    );

    return created.rows[0];
  }

  /**
   * Create a brand-new session regardless of existing sessions.
   *
   * @param {string} datasetId
   * @param {string} userId
   * @param {string} [title='New Chat']
   * @returns {Promise<{ id: number, title: string, created_at: string, updated_at: string }>}
   */
  async createSession(datasetId, userId, title = 'New Chat') {
    const result = await pool.query(
      `INSERT INTO chat_sessions (user_id, dataset_id, title)
       VALUES ($1::uuid, $2::uuid, $3)
       RETURNING id, title, created_at, updated_at`,
      [userId, datasetId, title]
    );
    return result.rows[0];
  }

  /**
   * Fetch a single session by ID, enforcing user ownership.
   *
   * @param {number} sessionId
   * @param {string} userId
   * @returns {Promise<object|null>}
   */
  async findSessionById(sessionId, userId) {
    const result = await pool.query(
      `SELECT id, dataset_id, title, created_at, updated_at
         FROM chat_sessions
        WHERE id      = $1
          AND user_id = $2::uuid`,
      [sessionId, userId]
    );
    return result.rows[0] ?? null;
  }

  /**
   * List all sessions for a dataset, newest first.
   *
   * @param {string} datasetId
   * @param {string} userId
   * @returns {Promise<Array<{ id: number, title: string, created_at: string, updated_at: string }>>}
   */
  async getSessionsByDataset(datasetId, userId) {
    const result = await pool.query(
      `SELECT id, title, created_at, updated_at
         FROM chat_sessions
        WHERE dataset_id = $1::uuid
          AND user_id    = $2::uuid
        ORDER BY updated_at DESC`,
      [datasetId, userId]
    );
    return result.rows;
  }

  /**
   * Touch the updated_at timestamp on a session (called after each new message).
   *
   * @param {number} sessionId
   * @returns {Promise<void>}
   */
  async touchSession(sessionId) {
    await pool.query(
      `UPDATE chat_sessions
          SET updated_at = NOW()
        WHERE id = $1`,
      [sessionId]
    );
  }

  // ──────────────────────────────────────────────────────────────────────── //
  // MESSAGES                                                                 //
  // ──────────────────────────────────────────────────────────────────────── //

  /**
   * Persist a single chat message.
   *
   * @param {number} sessionId
   * @param {'user'|'ai'} sender
   * @param {string} message
   * @returns {Promise<{ id: number, session_id: number, sender: string, message: string, created_at: string }>}
   */
  async saveMessage(sessionId, sender, message) {
    const result = await pool.query(
      `INSERT INTO chat_messages (session_id, sender, message)
       VALUES ($1, $2, $3)
       RETURNING id, session_id, sender, message, created_at`,
      [sessionId, sender, message]
    );
    return result.rows[0];
  }

  /**
   * Fetch the most recent N messages for a session, oldest first
   * (so they can be fed directly to the LLM as conversation history).
   *
   * @param {number} sessionId
   * @param {number} [limit=20]
   * @returns {Promise<Array<{ id: number, sender: string, message: string, created_at: string }>>}
   */
  async getSessionMessages(sessionId, limit = 20) {
    const result = await pool.query(
      `SELECT id, sender, message, created_at
         FROM (
           SELECT id, sender, message, created_at
             FROM chat_messages
            WHERE session_id = $1
            ORDER BY created_at DESC
            LIMIT $2
         ) sub
        ORDER BY created_at ASC`,
      [sessionId, limit]
    );
    return result.rows;
  }

  /**
   * Delete all messages in a session (clear history).
   *
   * @param {number} sessionId
   * @returns {Promise<number>}  Number of deleted rows
   */
  async deleteSessionMessages(sessionId) {
    const result = await pool.query(
      `DELETE FROM chat_messages WHERE session_id = $1`,
      [sessionId]
    );
    return result.rowCount;
  }
}

export default new ChatModel();
