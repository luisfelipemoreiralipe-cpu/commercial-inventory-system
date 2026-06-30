const AppError = require('../utils/AppError');

/**
 * Centralized error handling middleware.
 * Must be registered LAST in app.js.
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
    // 1. Known operational error (thrown by AppError)
    if (err.isOperational) {
        // LOGGING TEMPORÁRIO PARA DEBUG
        console.error("DEBUG [AppError]:", err.message, err.stack);
        
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    // 2. Prisma — unique constraint violation
    if (err.code === 'P2002') {
        const field = err.meta?.target?.[0] || 'campo';
        return res.status(409).json({
            success: false,
            message: `Já existe um registro com esse ${field}.`,
        });
    }

    // 3. Prisma — record not found
    if (err.code === 'P2025') {
        return res.status(404).json({
            success: false,
            message: 'Registro não encontrado.',
        });
    }

    // 4. Prisma — foreign key constraint
    if (err.code === 'P2003') {
        return res.status(400).json({
            success: false,
            message: 'Referência inválida. Verifique os IDs enviados.',
        });
    }

    // 5. Prisma — database connection errors
    const dbConnectionCodes = ['P1001', 'P1002', 'P1008', 'P1017'];
    const isDbConnectionError = dbConnectionCodes.includes(err.code) ||
        err.message?.includes('enetunreach') ||
        err.message?.includes('Server has closed the connection') ||
        err.message?.includes('Can\'t reach database server') ||
        err.message?.includes('Connection refused');

    if (isDbConnectionError) {
        console.error('[DATABASE CONNECTION ERROR]', {
            code: err.code,
            message: err.message?.substring(0, 200),
            path: req.path,
            method: req.method,
        });

        return res.status(503).json({
            success: false,
            message: 'Serviço temporariamente indisponível. Tente novamente em alguns segundos.',
        });
    }

    // 6. Unknown error — log but do NOT expose details to client
    console.error('[UNHANDLED ERROR]', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor.',
    });
};

module.exports = errorMiddleware;
