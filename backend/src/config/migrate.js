import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  // Path to backend/migrations/
  const migrationsDir = path.join(__dirname, '../../migrations');
  
  try {
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Migrations directory does not exist at: ${migrationsDir}`);
      process.exit(1);
    }

    // Get all SQL files in the migrations directory and sort them alphabetically
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
      
    console.log(`Found ${files.length} migration file(s) to execute...`);
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        console.log(`Running migration: ${file}`);
        await client.query(sql);
      }
      
      await client.query('COMMIT');
      console.log('All migrations executed successfully!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Migration failed, transaction rolled back:', err);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error running migrations:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
