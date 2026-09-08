import express from 'express';
import chatController from '../controllers/chatController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /api/chat/:datasetId
 *
 * Body: { "question": "...", "session_id"?: number }
 * Returns: { success, dataset_id, session_id, session_title, question, answer }
 */
router.post('/:datasetId', authMiddleware, chatController.chatWithDataset);

/**
 * GET /api/chat/:datasetId/sessions
 *
 * List all chat sessions for a dataset (newest first).
 * Returns: { success, dataset_id, sessions: [{ id, title, created_at, updated_at }] }
 */
router.get('/:datasetId/sessions', authMiddleware, chatController.getSessions);

/**
 * GET /api/chat/:datasetId/history?session_id=<id>
 *
 * Fetch message history for a session.
 * If session_id is omitted the most-recent session is used.
 * Returns: { success, session_id, session_title, messages }
 */
router.get('/:datasetId/history', authMiddleware, chatController.getHistory);

/**
 * DELETE /api/chat/:datasetId/history?session_id=<id>
 *
 * Clear all messages in a session.
 * If session_id is omitted the most-recent session is used.
 * Returns: { success, session_id, deleted_count, message }
 */
router.delete('/:datasetId/history', authMiddleware, chatController.clearHistory);

export default router;

