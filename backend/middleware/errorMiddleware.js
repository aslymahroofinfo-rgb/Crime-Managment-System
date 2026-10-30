/**
 * Centralized Error Handling Middleware
 * Prevents stack trace / credential leakage in production
 */

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

const errorHandler = (err, req, res, next) => {
  // Log server-side
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'An unexpected internal server error occurred';

  // Handle Mongoose CastError (e.g. invalid ObjectId format)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format for ${err.path}`;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {}).map(val => val.message).join(', ');
  }

  // Handle Mongo duplicate key error (E11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  }

  // Handle JWT verification error
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token is invalid or expired';
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // Sanitize internal server errors in production to prevent leaking sensitive infrastructure or database info
  const clientMessage = isProduction && statusCode === 500
    ? 'An unexpected server error occurred. Please try again later.'
    : message;

  res.status(statusCode).json({
    message: clientMessage,
    ...(isProduction ? {} : { stack: err.stack })
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};

