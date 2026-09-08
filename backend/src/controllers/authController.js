import { z } from 'zod';
import authService from '../services/authService.js';
import { env } from '../config/env.js';

// Zod validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

class AuthController {
  /**
   * Register a new user
   */
  async register(req, res, next) {
    try {
      const parsedBody = registerSchema.parse(req.body);
      const newUser = await authService.register(parsedBody);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: newUser
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log in user
   */
  async login(req, res, next) {
    try {
      const parsedBody = loginSchema.parse(req.body);
      const { user, accessToken, rawRefreshToken } = await authService.login(parsedBody);

      // Set raw refresh token in HttpOnly cookie
      res.cookie('refreshToken', rawRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: '/'
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        accessToken,
        user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh token rotation
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token is missing'
        });
      }

      const { user, accessToken, rawRefreshToken: newRefreshToken } = await authService.refresh(refreshToken);

      // Set new refresh token in cookie (rotation)
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: '/'
      });

      res.status(200).json({
        success: true,
        accessToken
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log out user
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current authenticated user details
   */
  async getMe(req, res, next) {
    try {
      const userId = req.user.id;
      const userProfile = await authService.getUserProfile(userId);
      
      res.status(200).json({
        success: true,
        user: userProfile
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
