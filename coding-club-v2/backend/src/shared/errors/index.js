class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class NotFoundError extends AppError {
  constructor(msg = 'Not found') { super(msg, 404); }
}

class AuthError extends AppError {
  constructor(msg = 'Unauthorized') { super(msg, 401); }
}

class ForbiddenError extends AppError {
  constructor(msg = 'Forbidden') { super(msg, 403); }
}

class ValidationError extends AppError {
  constructor(msg = 'Validation failed') { super(msg, 400); }
}

class ConflictError extends AppError {
  constructor(msg = 'Already exists') { super(msg, 409); }
}

module.exports = { AppError, NotFoundError, AuthError, ForbiddenError, ValidationError, ConflictError };
