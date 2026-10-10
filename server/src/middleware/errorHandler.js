/**
 * Centralized Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  });
}

module.exports = errorHandler;
