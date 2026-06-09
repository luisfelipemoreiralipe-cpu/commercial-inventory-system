const productionService = require('../services/productionService');

/**
 * GET /api/productions/preview?productId=xxx&quantity=10
 * Calcula ingredientes necessários SEM alterar estoque
 */
const previewProduction = async (req, res, next) => {
    try {
        const { productId, quantity } = req.query;
        const establishmentId = req.user.establishmentId;

        if (!productId || !quantity) {
            return res.status(400).json({ message: 'productId e quantity são obrigatórios.' });
        }

        const preview = await productionService.previewProduction(productId, quantity, establishmentId);
        res.json(preview);

    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/productions
 * Lista ordens de produção do estabelecimento
 */
const listProductionOrders = async (req, res, next) => {
    try {
        const establishmentId = req.user.establishmentId;
        const { status, page = 1, limit = 20 } = req.query;

        const result = await productionService.listProductionOrders({
            establishmentId,
            status,
            page: Number(page),
            limit: Number(limit)
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/productions
 * Cria uma nova ordem de produção (status: PENDING)
 */
const createProductionOrder = async (req, res, next) => {
    try {
        const { productId, quantity, notes } = req.body;
        const establishmentId = req.user.establishmentId;
        const createdBy = req.user.userId; // Correção: authMiddleware define como userId

        const order = await productionService.createProductionOrder({
            productId,
            quantity,
            notes,
            establishmentId,
            createdBy
        });

        res.status(201).json(order);
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/productions/:id/complete
 * Conclui a produção: baixa insumos + entrada no produto final
 */
const completeProductionOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const establishmentId = req.user.establishmentId;

        const result = await productionService.completeProductionOrder(id, establishmentId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/productions/:id/cancel
 * Cancela uma ordem pendente
 */
const cancelProductionOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const establishmentId = req.user.establishmentId;

        const result = await productionService.cancelProductionOrder(id, establishmentId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/productions/stats
 * Retorna estatísticas de produção por período
 */
const getProductionStats = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const establishmentId = req.user.establishmentId;

        const stats = await productionService.getProductionStats({
            establishmentId,
            startDate,
            endDate
        });

        res.json(stats);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    previewProduction,
    listProductionOrders,
    createProductionOrder,
    completeProductionOrder,
    cancelProductionOrder,
    getProductionStats
};
