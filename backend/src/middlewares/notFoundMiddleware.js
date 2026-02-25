/**
 * Catches requests to undefined routes.
 */
const notFoundMiddleware = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    });
};

module.exports = notFoundMiddleware;
