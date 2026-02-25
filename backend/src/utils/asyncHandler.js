/**
 * Wraps an async Express route handler to forward errors to next().
 * Eliminates the need for try/catch in every controller.
 *
 * @param {Function} fn - Async (req, res, next) handler.
 * @returns {Function} Express-compatible route handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
