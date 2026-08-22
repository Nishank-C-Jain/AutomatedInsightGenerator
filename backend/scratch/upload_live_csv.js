import pool from '../src/config/db.js';

async function main() {
  const PORT = 5000;
  const BASE_URL = `http://localhost:${PORT}/api`;
  const email = `flow_test_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log('1. Registering user...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Flow Tester',
      email: email,
      password: password
    })
  });
  const regJson = await regRes.json();
  console.log('Register Response:', regJson);
  if (!regJson.success) throw new Error('Registration failed');

  console.log('\n2. Logging in...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });
  const loginJson = await loginRes.json();
  const token = loginJson.accessToken;
  console.log('Login Response:', loginJson);
  if (!token) throw new Error('Login failed');

  console.log('\n3. Uploading sample CSV file to live backend...');
  const csvContent = 'id,product,price\n1,Apples,1.99\n2,Oranges,2.49\n3,Bananas,0.99\n4,Grapes,3.99\n5,Peaches,2.99';
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const formData = new FormData();
  formData.append('file', blob, 'sample_store_data.csv');

  const uploadRes = await fetch(`${BASE_URL}/datasets/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  const uploadJson = await uploadRes.json();
  console.log('Upload Response:', uploadJson);

  if (uploadJson.success) {
    const datasetId = uploadJson.dataset.id;
    console.log(`\n4. Querying PostgreSQL directly for dataset ID: ${datasetId}...`);
    const dbRes = await pool.query('SELECT * FROM datasets WHERE id = $1', [datasetId]);
    console.log('Database Result (PostgreSQL Row):');
    console.log(JSON.stringify(dbRes.rows[0], null, 2));
  } else {
    console.error('Upload failed, cannot query PostgreSQL.');
  }

  await pool.end();
}

main().catch(err => {
  console.error('Flow test error:', err);
  pool.end();
});
