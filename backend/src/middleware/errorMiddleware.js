import { ZodError } from 'zod';

/**
 * Centralized Global Error Handling Middleware
 */
const errorMiddleware = (err, req, res, next) => {
  // If headers have already been sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  console.error(`[Error Log] ${req.method} ${req.url}:`, err);

  // Handle Zod Validation Errors
  if (err && err.name === 'ZodError') {
    // Format validation errors into a clean key-value object (e.g. { email: "Invalid email" })
    const formattedErrors = {};
    const errorsList = err.errors || err.issues || [];
    errorsList.forEach(e => {
      const fieldName = e.path ? e.path.join('.') : 'unknown';
      formattedErrors[fieldName] = e.message;
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }

  // Handle known application errors
  const message = err.message || 'Internal Server Error';
  let status = err.status || 500;

  // Map business logic errors to specific HTTP status codes
  if (message.includes('already registered') || message.includes('already exists') || message.includes('already taken')) {
    status = 409; // Conflict
  } else if (message.includes('Invalid email or password') || message.includes('Invalid or expired')) {
    status = 401; // Unauthorized
  }

  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(status).json({
    success: false,
    message: isProduction && status === 500 ? 'Internal Server Error' : message
  });
};

export default errorMiddleware;
