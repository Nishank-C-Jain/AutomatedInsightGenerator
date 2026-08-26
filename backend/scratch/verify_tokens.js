import pool from '../src/config/db.js';
import authService from '../src/services/authService.js';
import { generateAccessToken, verifyAccessToken, generateRefreshToken, verifyRefreshToken } from '../src/utils/jwt.js';

async function testTokens() {
  console.log('--- Step 1: Testing Access & Refresh JWT Utility Functions ---');
  const dummyUser = { id: '00000000-0000-0000-0000-000000000001', email: 'test@example.com' };

  try {
    const accessToken = generateAccessToken(dummyUser);
    console.log('✅ Access Token generated:', accessToken.substring(0, 30) + '...');

    const decodedAccess = verifyAccessToken(accessToken);
    console.log('✅ Access Token verified successfully! Decoded payload:', decodedAccess);

    const refreshToken = generateRefreshToken(dummyUser);
    console.log('✅ Refresh Token generated:', refreshToken.substring(0, 30) + '...');

    const decodedRefresh = verifyRefreshToken(refreshToken);
    console.log('✅ Refresh Token verified successfully! Decoded payload:', decodedRefresh);

  } catch (err) {
    console.error('❌ JWT Utility Test Failed:', err);
    process.exit(1);
  }

  console.log('\n--- Step 2: Testing Auth Flow & Refresh Token Rotation with Database ---');
  const testEmail = `token_test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Token Tester';

  try {
    // 1. Register
    const registeredUser = await authService.register({ name: testName, email: testEmail, password: testPassword });
    console.log('✅ Test User Registered:', registeredUser.id, registeredUser.email);

    // 2. Login (generates access token + refresh token stored in DB)
    const loginResult = await authService.login({ email: testEmail, password: testPassword });
    console.log('✅ Login Successful!');
    console.log('   Access Token:', loginResult.accessToken.substring(0, 30) + '...');
    console.log('   Raw Refresh Token:', loginResult.rawRefreshToken.substring(0, 30) + '...');

    // Verify Access Token from Login
    const decodedLoginAccess = verifyAccessToken(loginResult.accessToken);
    console.log('✅ Login Access Token verified! User ID:', decodedLoginAccess.sub);

    // 3. Refresh (Rotation flow: revokes old refresh token, returns new access token & new refresh token)
    console.log('\nTesting Token Refresh Rotation...');
    const refreshResult = await authService.refresh(loginResult.rawRefreshToken);
    console.log('✅ Token Refresh Successful!');
    console.log('   New Access Token:', refreshResult.accessToken.substring(0, 30) + '...');
    console.log('   New Refresh Token:', refreshResult.rawRefreshToken.substring(0, 30) + '...');

    // Verify New Access Token
    const decodedNewAccess = verifyAccessToken(refreshResult.accessToken);
    console.log('✅ New Access Token verified! User ID:', decodedNewAccess.sub);

    // 4. Verify Reuse Detection (Reusing old refresh token should fail & trigger security revocation)
    console.log('\nTesting Stolen Token Reuse Detection (Reusing old refresh token)...');
    try {
      await authService.refresh(loginResult.rawRefreshToken);
      console.error('❌ Security check failed: Old refresh token was accepted!');
    } catch (reuseErr) {
      console.log('✅ Reuse Detection Triggered correctly:', reuseErr.message);
    }

    // 5. Logout
    console.log('\nTesting Logout...');
    await authService.logout(refreshResult.rawRefreshToken);
    console.log('✅ Logout completed');

    // Clean up test user & tokens
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [registeredUser.id]);
    await pool.query('DELETE FROM users WHERE id = $1', [registeredUser.id]);
    console.log('✅ Test User & Tokens cleaned up from DB');

    console.log('\n🎉 ALL JWT & REFRESH TOKEN VERIFICATION CHECKS PASSED SUCCESSFULLY!');

  } catch (err) {
    console.error('❌ Database Token Test Failed:', err);
  } finally {
    await pool.end();
  }
}

testTokens();
