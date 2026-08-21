import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { hashToken } from '../utils/token.js';

class AuthService {
  /**
   * Register a new user
   */
  async register({ name, email, password }) {
    // 1. Check if email already exists
    const checkQuery = 'SELECT id FROM users WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [email.toLowerCase()]);

    if (checkResult.rows.length > 0) {
      throw new Error('Email is already registered');
    }

    // 2. Hash password
    const saltRounds = 12; // High security cost factor
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Insert user into DB
    const insertQuery = `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at
    `;
    const result = await pool.query(insertQuery, [
      name,
      email.toLowerCase(),
      passwordHash
    ]);

    return result.rows[0];
  }

  /**
   * Log in user
   */
  async login({ email, password }) {
    // 1. Retrieve user by email
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email.toLowerCase()]);

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // 3. Generate access and refresh JWTs
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 4. Hash the refresh token before database storage
    const tokenHash = hashToken(refreshToken);

    // 5. Store hash in PostgreSQL (expiring in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const insertTokenQuery = `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `;
    await pool.query(insertTokenQuery, [user.id, tokenHash, expiresAt]);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      accessToken,
      rawRefreshToken: refreshToken
    };
  }

  /**
   * Refresh access and refresh tokens (Rotation flow)
   */
  async refresh(rawRefreshToken) {
    if (!rawRefreshToken) {
      throw new Error('Refresh token is required');
    }

    // 1. Verify JWT signature & type of incoming token
    let decoded;
    try {
      decoded = verifyRefreshToken(rawRefreshToken);
    } catch (err) {
      throw new Error('Invalid or expired refresh token');
    }

    const userId = decoded.sub;
    const tokenHash = hashToken(rawRefreshToken);

    // 2. Query for the token record in database
    const dbTokenQuery = 'SELECT * FROM refresh_tokens WHERE token_hash = $1';
    const dbTokenResult = await pool.query(dbTokenQuery, [tokenHash]);

    // Scenario A: Valid JWT signature but not found in the DB (deleted or tampered logs)
    if (dbTokenResult.rows.length === 0) {
      throw new Error('Invalid or expired refresh token');
    }

    const dbTokenRecord = dbTokenResult.rows[0];

    // Scenario B: Stolen Token Reuse Detection
    // If the token is already marked as revoked, it indicates suspicious reuse
    if (dbTokenRecord.revoked_at !== null) {
      console.warn(`🚨 Suspicious Activity: Revoked refresh token reuse attempted for user: ${userId}`);
      
      // Revoke the ENTIRE token family (all active sessions) for this user as a security measure
      const revokeFamilyQuery = 'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1';
      await pool.query(revokeFamilyQuery, [userId]);
      
      throw new Error('Session revoked due to suspicious activity. Please login again.');
    }

    // Scenario C: Expired refresh token
    if (new Date() > new Date(dbTokenRecord.expires_at)) {
      const expireQuery = 'UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1';
      await pool.query(expireQuery, [dbTokenRecord.id]);
      throw new Error('Refresh token has expired');
    }

    // 3. Verify user still exists
    const userQuery = 'SELECT id, name, email FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User no longer exists');
    }

    const user = userResult.rows[0];

    // 4. Generate new tokens (Access Token + New Rotate Refresh Token)
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newHash = hashToken(newRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 5. Commit rotation in a PostgreSQL Transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // A. Insert new refresh token record
      const insertTokenQuery = `
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
        RETURNING id
      `;
      const insertResult = await client.query(insertTokenQuery, [userId, newHash, expiresAt]);
      const newRecordId = insertResult.rows[0].id;

      // B. Revoke the old token record and record which new token replaced it
      const updateOldTokenQuery = `
        UPDATE refresh_tokens
        SET revoked_at = NOW(), replaced_by_token_id = $1
        WHERE id = $2
      `;
      await client.query(updateOldTokenQuery, [newRecordId, dbTokenRecord.id]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return {
      user,
      accessToken: newAccessToken,
      rawRefreshToken: newRefreshToken
    };
  }

  /**
   * Log out user (Revoke refresh token hash)
   */
  async logout(rawRefreshToken) {
    if (!rawRefreshToken) return;

    try {
      const tokenHash = hashToken(rawRefreshToken);
      
      // Revoke token by setting revoked_at timestamp
      const query = 'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1';
      await pool.query(query, [tokenHash]);
    } catch (error) {
      // Fail silently to ensure logout endpoint remains safe
      console.error('Error during token revocation in logout:', error.message);
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId) {
    const query = 'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }
}

export default new AuthService();
