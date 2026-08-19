import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads static folder
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api', apiRouter);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Automated Insight Generator API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export app
import pool from './config/db.js';

async function testDatabaseConnection() {
  try {
    const result = await pool.query("SELECT * FROM test_users");
    console.log(result.rows);
    console.log("Database connected successfully!");
  } catch (error) {
    console.error("Database connection failed:");
    console.error(error.message);
  } finally {
    await pool.end();
  }
}

testDatabaseConnection();

export default app;
