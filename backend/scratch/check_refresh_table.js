import pool from '../src/config/db.js';

async function checkRefreshTable() {
  try {
    const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'refresh_tokens'");
    console.log('refresh_tokens columns:', cols.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkRefreshTable();
