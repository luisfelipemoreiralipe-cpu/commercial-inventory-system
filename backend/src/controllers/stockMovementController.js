const stockMovementService = require('../services/stockMovementService');
const asyncHandler = require('../utils/asyncHandler');

// 🔍 LISTAR MOVIMENTAÇÕES (já existia)
const getAll = asyncHandler(async (req, res) => {

    const { productId, dateFrom, dateTo } = req.query;

    const data = await stockMovementService.getMovements({
        productId,
        dateFrom,
        dateTo
    });

    res.json({
        success: true,
        data
    });

});

// 🔥 NOVO: CONSUMO INTERNO
const createInternalUse = asyncHandler(async (req, res) => {

    const { productId, quantity } = req.body;

    const establishmentId = req.user.establishmentId;
    const userId = req.user.userId;

    await stockMovementService.createInternalUse({
        productId,
        quantity,
        establishmentId,
        userId
    });

    res.json({
        success: true,
        message: "Consumo interno registrado com sucesso"
    });

});

module.exports = {
    getAll,
    createInternalUse // 👈 novo export
};