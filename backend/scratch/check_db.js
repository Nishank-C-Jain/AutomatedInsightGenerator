import pool from '../src/config/db.js';

async function check() {
  try {
    const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'datasets'");
    console.log('datasets columns:', cols.rows);

    const rows = await pool.query("SELECT id, name, status, (analysis_results IS NOT NULL) as has_analysis, updated_at FROM datasets");
    console.log('datasets rows:', rows.rows);

    const insights = await pool.query("SELECT count(*) FROM insights");
    console.log('insights count:', insights.rows[0].count);

    const anomalies = await pool.query("SELECT count(*) FROM anomalies");
    console.log('anomalies count:', anomalies.rows[0].count);
  } catch (err) {
    console.error('Error checking DB:', err);
  } finally {
    await pool.end();
  }
}

check();
