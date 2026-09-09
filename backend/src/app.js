import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import errorMiddleware from './middleware/errorMiddleware.js';
import pool from './config/db.js';


const app = express();

// Required when deployed behind Render's reverse proxy
app.set("trust proxy", 1);

// Security headers
app.use(helmet());

// CORS configuration — supports local dev and deployed frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  env.FRONTEND_URL,          // set FRONTEND_URL on Render dashboard
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server (no origin) or listed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is running',
    environment: process.env.NODE_ENV
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Automated Insight Generator API is running.'
  });
});

export default app;
