import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Chat endpoint working' });
});

export default router;
