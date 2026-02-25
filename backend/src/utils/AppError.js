/**
 * Custom operational error class.
 * Distinguishes expected (user-facing) errors from unexpected crashes.
 */
class AppError extends Error {
    /**
     * @param {string} message - Human-readable error message.
     * @param {number} statusCode - HTTP status code to return.
     */
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // signals: safe to expose to client
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
