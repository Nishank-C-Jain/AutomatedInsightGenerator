import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Datasets endpoint working' });
});

export default router;
