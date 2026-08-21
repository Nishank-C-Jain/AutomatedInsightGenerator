import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Access Authentication Middleware
 * Validates JWT access token from the Authorization Bearer header
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Verify token using JWT_ACCESS_SECRET
    const decoded = verifyAccessToken(token);
    
    // Attach user ID from subject claim (sub) to the request object
    req.user = {
      id: decoded.sub
    };
    
    next();
  } catch (error) {
    // Fail securely and generically - do not expose verification errors to the client
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
};

export default authMiddleware;
