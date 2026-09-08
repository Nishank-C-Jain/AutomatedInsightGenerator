import app from './app.js';
import pool from './config/db.js';
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 5000;

// Test DB connection and start Express server
async function startServer() {
  try {
    // Perform a quick query to test connection
    const result = await pool.query('SELECT NOW()');
    console.log(`Database connected successfully at: ${result.rows[0].now}`);

    // Start listening
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Graceful Shutdown Handler
    const shutdown = (signal) => {
      console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          await pool.end();
          console.log('Database pool connections closed.');
          process.exit(0);
        } catch (err) {
          console.error('Error closing database pool:', err);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        console.error('Forceful shutdown triggered.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server due to database connection issue:');
    console.error(error.message);
    process.exit(1);
  }
}


startServer();
