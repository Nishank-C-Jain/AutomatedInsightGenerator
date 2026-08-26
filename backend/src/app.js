import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import errorMiddleware from './middleware/errorMiddleware.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration supporting dynamic validation and HttpOnly credential transfers
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser for reading HttpOnly refresh token cookies
app.use(cookieParser());

// Serve static upload resources
app.use('/uploads', express.static('uploads'));

// Mount API routes (includes /auth, /datasets, /analytics, /dashboard, etc.)
app.use('/api', apiRouter);

// Healthcheck Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Automated Insight Generator API is running.'
  });
});

// Centralized error handler (must be registered after all route definitions)
app.use(errorMiddleware);

export default app;
