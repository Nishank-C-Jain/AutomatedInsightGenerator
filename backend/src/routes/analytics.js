import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Analytics endpoint working' });
});

export default router;
