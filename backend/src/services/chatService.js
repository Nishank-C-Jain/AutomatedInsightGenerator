import axios from 'axios';
import pool from '../config/db.js';
import { env } from '../config/env.js';
import ChatModel from '../models/chatModel.js';

/**
 * ChatService
 *
 * Business-logic layer for dataset-specific AI chat.
 *
 * Full chat pipeline per message:
 *   1. Verify dataset ownership and pull ai_context from DB.
 *   2. Find or create a chat session for this user × dataset.
 *   3. Load the last 20 messages from that session as conversation history.
 *   4. Forward { question, ai_context, conversation_history } to the Python
 *      FastAPI service (POST /api/chat).
 *   5. Persist both the user message and the AI answer to chat_messages.
 *   6. Touch the session's updated_at timestamp.
 *   7. Return the answer + session metadata to the caller.
 */
class ChatService {

  // ──────────────────────────────────────────────────────────────────────── //
  // CHAT                                                                     //
  // ──────────────────────────────────────────────────────────────────────── //

  /**
   * Send a question and get a grounded AI answer.
   *
   * @param {string}      datasetId
   * @param {string}      userId
   * @param {string}      question      - The user's natural-language question
   * @param {number|null} [sessionId]   - Explicitly target a session; omit to
   *                                      use the most-recent one (or create new)
   * @returns {Promise<{
   *   answer:      string,
   *   session_id:  number,
   *   session_title: string,
   * }>}
   */
  async chat(datasetId, userId, question, sessionId = null) {

    // ── 1. Verify dataset ownership + pull ai_context ────────────────────── //
    const datasetRow = await pool.query(
      `SELECT analysis_results, status
         FROM datasets
        WHERE id = $1::uuid AND user_id = $2::uuid`,
      [datasetId, userId]
    );

    if (datasetRow.rows.length === 0) {
      const err = new Error('Dataset not found.');
      err.statusCode = 404;
      throw err;
    }

    const { analysis_results, status } = datasetRow.rows[0];

    if (!analysis_results) {
      const err = new Error(
        `Dataset status is "${status}". Please run analysis first before chatting.`
      );
      err.statusCode = 422;
      throw err;
    }

    const ai_context = analysis_results.ai_context;

    if (!ai_context) {
      const err = new Error('No AI context found. Re-run analysis to regenerate it.');
      err.statusCode = 422;
      throw err;
    }

    // ── 2. Resolve session ───────────────────────────────────────────────── //
    let session;
    if (sessionId) {
      session = await ChatModel.findSessionById(sessionId, userId);
      if (!session) {
        const err = new Error(`Chat session ${sessionId} not found.`);
        err.statusCode = 404;
        throw err;
      }
    } else {
      session = await ChatModel.findOrCreateSession(datasetId, userId);
    }

    // ── 3. Load conversation history (last 20 turns) ─────────────────────── //
    const recentMessages = await ChatModel.getSessionMessages(session.id, 20);

    // Shape: [{ sender: 'user'|'ai', message: '...' }, ...]  (oldest first)
    const conversation_history = recentMessages.map(m => ({
      sender: m.sender,
      message: m.message,
    }));

    // ── 4. Forward to Python analytics service ───────────────────────────── //
    const pythonUrl = env.PYTHON_API_URL || 'http://127.0.0.1:8000';

    const pythonResponse = await axios.post(
      `${pythonUrl}/api/chat`,
      {
        question: question.trim(),
        ai_context,
        conversation_history: conversation_history.length > 0
          ? conversation_history
          : undefined,
      },
      { timeout: 60_000 }
    );

    const { answer } = pythonResponse.data;

    // ── 5. Persist user message + AI answer ──────────────────────────────── //
    await ChatModel.saveMessage(session.id, 'user', question.trim());
    await ChatModel.saveMessage(session.id, 'ai', answer);

    // ── 6. Touch session updated_at ──────────────────────────────────────── //
    await ChatModel.touchSession(session.id);

    return {
      answer,
      session_id: session.id,
      session_title: session.title,
    };
  }

  // ──────────────────────────────────────────────────────────────────────── //
  // HISTORY                                                                  //
  // ──────────────────────────────────────────────────────────────────────── //

  /**
   * Return messages for a session.
   *
   * If sessionId is omitted the most-recent session for this dataset is used.
   * Returns null (rather than throwing) if no session exists yet.
   *
   * @param {string}      datasetId
   * @param {string}      userId
   * @param {number|null} [sessionId]
   * @returns {Promise<{ session_id: number, messages: Array } | null>}
   */
  async getHistory(datasetId, userId, sessionId = null) {
    let session;

    if (sessionId) {
      session = await ChatModel.findSessionById(sessionId, userId);
      if (!session) {
        const err = new Error(`Chat session ${sessionId} not found.`);
        err.statusCode = 404;
        throw err;
      }
    } else {
      // Return the most-recently-updated session for this dataset
      const sessions = await ChatModel.getSessionsByDataset(datasetId, userId);
      session = sessions[0] ?? null;
    }

    if (!session) {
      return null;
    }

    const messages = await ChatModel.getSessionMessages(session.id, 100);

    return {
      session_id: session.id,
      session_title: session.title,
      messages,
    };
  }

  /**
   * Delete all messages for a session (clear chat history).
   *
   * @param {string}      datasetId
   * @param {string}      userId
   * @param {number|null} [sessionId]
   * @returns {Promise<{ session_id: number, deleted_count: number }>}
   */
  async clearHistory(datasetId, userId, sessionId = null) {
    let session;

    if (sessionId) {
      session = await ChatModel.findSessionById(sessionId, userId);
      if (!session) {
        const err = new Error(`Chat session ${sessionId} not found.`);
        err.statusCode = 404;
        throw err;
      }
    } else {
      const sessions = await ChatModel.getSessionsByDataset(datasetId, userId);
      session = sessions[0] ?? null;
    }

    if (!session) {
      return { session_id: null, deleted_count: 0 };
    }

    const deletedCount = await ChatModel.deleteSessionMessages(session.id);

    return {
      session_id: session.id,
      deleted_count: deletedCount,
    };
  }

  // ──────────────────────────────────────────────────────────────────────── //
  // SESSIONS                                                                 //
  // ──────────────────────────────────────────────────────────────────────── //

  /**
   * List all chat sessions for a dataset (newest first).
   *
   * @param {string} datasetId
   * @param {string} userId
   * @returns {Promise<Array<{ id: number, title: string, created_at: string, updated_at: string }>>}
   */
  async getSessions(datasetId, userId) {
    return ChatModel.getSessionsByDataset(datasetId, userId);
  }
}

export default new ChatService();
