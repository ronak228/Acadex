/**
 * Centralized global error handling middleware.
 * Formats errors and sends a clean JSON structure to the client.
 */
const errorMiddleware = (err, req, res, next) => {
  console.error('Unhandled error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || []
  });
};

module.exports = {
  errorMiddleware
};
