const env = require('../config/env');

// Central error handler. Never leaks stack traces unless we are *explicitly*
// in development, and always returns a consistent { message } shape so the
// frontend can render errors uniformly.
function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Always log server-side so Render's logs stay useful.
  if (statusCode >= 500) console.error('[error]', err);

  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    // Fail closed: anything other than an explicit development env hides the stack.
    ...(env.nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = { notFound, errorHandler };