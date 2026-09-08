import chatService from '../services/chatService.js';

/**
 * ChatController
 *
 * Thin HTTP layer — validates request shape, delegates business logic to
 * ChatService, and formats JSON responses.
 *
 * Routes (mounted under /api/chat):
 *   POST   /:datasetId              — ask a question, get an AI answer
 *   GET    /:datasetId/sessions     — list all sessions for a dataset
 *   GET    /:datasetId/history      — fetch messages for a session
 *   DELETE /:datasetId/history      — clear all messages in a session
 */

// ─────────────────────────────────────────────────────────────────────────── //
// POST /api/chat/:datasetId                                                    //
// ─────────────────────────────────────────────────────────────────────────── //

/**
 * Ask a natural-language question about a dataset.
 *
 * Body:    { "question": "...", "session_id"?: number }
 * Returns: { success, dataset_id, session_id, session_title, question, answer }
 */
const chatWithDataset = async (req, res) => {
  try {
    const userId        = req.user.id;
    const { datasetId } = req.params;
    const { question, session_id } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question must not be empty.',
      });
    }

    const result = await chatService.chat(
      datasetId,
      userId,
      question,
      session_id ?? null
    );

    return res.status(200).json({
      success:       true,
      dataset_id:    datasetId,
      session_id:    result.session_id,
      session_title: result.session_title,
      question:      question.trim(),
      answer:        result.answer,
    });

  } catch (error) {
    console.error('[chatController] chatWithDataset error:', error.message);

    const pythonDetail =
      error.response?.data?.detail ||
      error.response?.data?.message;

    const status = error.statusCode || error.response?.status || 500;

    return res.status(status).json({
      success: false,
      message: pythonDetail || error.message || 'Chat request failed.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────── //
// GET /api/chat/:datasetId/sessions                                            //
// ─────────────────────────────────────────────────────────────────────────── //

/**
 * List all chat sessions for a dataset (newest first).
 *
 * Returns: { success, dataset_id, sessions: [{ id, title, created_at, updated_at }] }
 */
const getSessions = async (req, res) => {
  try {
    const userId        = req.user.id;
    const { datasetId } = req.params;

    const sessions = await chatService.getSessions(datasetId, userId);

    return res.status(200).json({
      success:    true,
      dataset_id: datasetId,
      sessions,
    });

  } catch (error) {
    console.error('[chatController] getSessions error:', error.message);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to fetch chat sessions.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────── //
// GET /api/chat/:datasetId/history?session_id=<id>                            //
// ─────────────────────────────────────────────────────────────────────────── //

/**
 * Fetch the message history for a session.
 *
 * Query params: session_id (optional — defaults to most-recent session)
 * Returns: { success, session_id, session_title, messages }
 */
const getHistory = async (req, res) => {
  try {
    const userId        = req.user.id;
    const { datasetId } = req.params;
    const sessionId     = req.query.session_id
      ? Number(req.query.session_id)
      : null;

    const result = await chatService.getHistory(datasetId, userId, sessionId);

    if (!result) {
      return res.status(200).json({
        success:       true,
        dataset_id:    datasetId,
        session_id:    null,
        session_title: null,
        messages:      [],
        message:       'No chat session found for this dataset yet.',
      });
    }

    return res.status(200).json({
      success:       true,
      dataset_id:    datasetId,
      session_id:    result.session_id,
      session_title: result.session_title,
      messages:      result.messages,
    });

  } catch (error) {
    console.error('[chatController] getHistory error:', error.message);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to fetch chat history.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────── //
// DELETE /api/chat/:datasetId/history?session_id=<id>                         //
// ─────────────────────────────────────────────────────────────────────────── //

/**
 * Clear all messages in a session.
 *
 * Query params: session_id (optional — defaults to most-recent session)
 * Returns: { success, session_id, deleted_count, message }
 */
const clearHistory = async (req, res) => {
  try {
    const userId        = req.user.id;
    const { datasetId } = req.params;
    const sessionId     = req.query.session_id
      ? Number(req.query.session_id)
      : null;

    const result = await chatService.clearHistory(datasetId, userId, sessionId);

    return res.status(200).json({
      success:       true,
      session_id:    result.session_id,
      deleted_count: result.deleted_count,
      message:       'Chat history cleared.',
    });

  } catch (error) {
    console.error('[chatController] clearHistory error:', error.message);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to clear chat history.',
    });
  }
};

export default { chatWithDataset, getSessions, getHistory, clearHistory };

