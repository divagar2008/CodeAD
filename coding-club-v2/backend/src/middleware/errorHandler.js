function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error(`[${statusCode}] ${message}`, err.stack);
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'Record already exists' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' });
  }

  res.status(statusCode).json({ success: false, message });
}

module.exports = errorHandler;
