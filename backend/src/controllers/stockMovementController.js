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
const createInternalUse = async (req, res) => {

    try {

        const { productId, quantity } = req.body;

        const establishmentId = req.user.establishmentId;
        const userId = req.user.id;

        await stockMovementService.createInternalUse({
            productId,
            quantity,
            establishmentId,
            userId
        });

        return res.json({
            success: true,
            message: "Consumo interno registrado com sucesso"
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
    getAll,
    createInternalUse // 👈 novo export
};