import express from 'express';
import authRouter from './authRoutes.js';
import usersRouter from './users.js';
import datasetsRouter from './datasets.js';
import analyticsRouter from './analytics.js';
import insightsRouter from './insights.js';
import anomaliesRouter from './anomalies.js';
import recommendationsRouter from './recommendations.js';
import chatRouter from './chat.js';
import reportsRouter from './reports.js';
import dashboardRouter from './dashboard.js';

const router = express.Router();

router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);
router.use('/users', usersRouter);
router.use('/datasets', datasetsRouter);
router.use('/analytics', analyticsRouter);
router.use('/insights', insightsRouter);
router.use('/anomalies', anomaliesRouter);
router.use('/recommendations', recommendationsRouter);
router.use('/chat', chatRouter);
router.use('/reports', reportsRouter);

export default router;
