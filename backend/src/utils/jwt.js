import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Generate a short-lived JWT access token for a user
 * @param {object} user - User object containing at least id
 * @returns {string} Signed JWT access token
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      sub: user.id, 
      type: 'access' 
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN }
  );
};

/**
 * Generate a long-lived JWT refresh token for a user
 * @param {object} user - User object containing at least id
 * @returns {string} Signed JWT refresh token
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      sub: user.id, 
      type: 'refresh' 
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN }
  );
};

/**
 * Verify a JWT access token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
export const verifyAccessToken = (token) => {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return decoded;
};

/**
 * Verify a JWT refresh token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
export const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return decoded;
};
