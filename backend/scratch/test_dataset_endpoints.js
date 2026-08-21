import app from '../src/app.js';
import pool from '../src/config/db.js';

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('--- Starting Dataset Endpoint Tests ---');
  
  // 1. Start Server
  const server = app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
  });

  try {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const testName = 'Test User';

    // 2. Register User
    console.log('\n1. Registering test user...');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword
      })
    });
    const registerJson = await registerRes.json();
    console.log('Register Response:', registerJson);
    if (!registerJson.success) throw new Error('Registration failed');

    // 3. Login
    console.log('\n2. Logging in test user...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginJson = await loginRes.json();
    console.log('Login Response:', loginJson);
    if (!loginJson.success) throw new Error('Login failed');
    const token = loginJson.accessToken;

    // 4. Test CSV Upload
    console.log('\n3. Testing CSV upload...');
    const csvContent = 'id,name,age,email\n1,Alice,30,alice@example.com\n2,Bob,25,bob@example.com\n3,Charlie,35,charlie@example.com';
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    
    const csvFormData = new FormData();
    csvFormData.append('file', csvBlob, 'customers.csv');
    csvFormData.append('name', 'Customer Dataset');

    const csvUploadRes = await fetch(`${BASE_URL}/datasets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: csvFormData
    });
    const csvUploadJson = await csvUploadRes.json();
    console.log('CSV Upload Response:', csvUploadJson);
    if (!csvUploadJson.success) throw new Error('CSV Upload failed');
    
    // Validate CSV metadata
    const csvData = csvUploadJson.dataset;
    if (csvData.row_count !== 3) throw new Error(`Expected 3 rows, got ${csvData.row_count}`);
    if (csvData.column_count !== 4) throw new Error(`Expected 4 columns, got ${csvData.column_count}`);
    if (csvData.name !== 'Customer Dataset') throw new Error(`Expected name Customer Dataset, got ${csvData.name}`);
    console.log('✅ CSV Upload verified: Correct row and column count parsed.');

    // 5. Test JSON Upload
    console.log('\n4. Testing JSON upload...');
    const jsonContent = JSON.stringify([
      { "product": "Laptop", "price": 1200, "inStock": true },
      { "product": "Mouse", "price": 25, "inStock": false },
      { "product": "Keyboard", "price": 45, "inStock": true },
      { "product": "Monitor", "price": 250, "inStock": true },
      { "product": "Desk", "price": 300, "inStock": true }
    ]);
    const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
    
    const jsonFormData = new FormData();
    jsonFormData.append('file', jsonBlob, 'products.json');

    const jsonUploadRes = await fetch(`${BASE_URL}/datasets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: jsonFormData
    });
    const jsonUploadJson = await jsonUploadRes.json();
    console.log('JSON Upload Response:', jsonUploadJson);
    if (!jsonUploadJson.success) throw new Error('JSON Upload failed');

    // Validate JSON metadata
    const jsonData = jsonUploadJson.dataset;
    if (jsonData.row_count !== 5) throw new Error(`Expected 5 rows, got ${jsonData.row_count}`);
    if (jsonData.column_count !== 3) throw new Error(`Expected 3 columns, got ${jsonData.column_count}`);
    if (jsonData.name !== 'products') throw new Error(`Expected default name products, got ${jsonData.name}`);
    console.log('✅ JSON Upload verified: Correct row and column count parsed.');

    // 6. Test Get Datasets List
    console.log('\n5. Retrieving datasets list...');
    const listRes = await fetch(`${BASE_URL}/datasets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const listJson = await listRes.json();
    console.log('Datasets List Response:', listJson);
    if (!listJson.success) throw new Error('Get datasets list failed');
    if (listJson.datasets.length !== 2) throw new Error(`Expected 2 datasets, got ${listJson.datasets.length}`);
    console.log('✅ Dataset list verified successfully.');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exitCode = 1;
  } finally {
    console.log('\nClosing server and database pool connections...');
    server.close(() => {
      console.log('Server closed.');
    });
    await pool.end();
    console.log('Database pool closed.');
  }
}

runTests();
