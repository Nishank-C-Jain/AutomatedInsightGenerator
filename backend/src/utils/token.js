import crypto from 'crypto';

/**
 * Hash a string (like a refresh token JWT) using SHA-256
 * @param {string} token - Raw token string
 * @returns {string} Hexadecimal SHA-256 hash
 */
export const hashToken = (token) => {
  if (!token) {
    throw new Error('Token string is required for hashing');
  }
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};
