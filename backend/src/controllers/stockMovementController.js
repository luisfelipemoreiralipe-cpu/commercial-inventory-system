const stockMovementService = require('../services/stockMovementService');
const asyncHandler = require('../utils/asyncHandler');

// 🔍 LISTAR MOVIMENTAÇÕES
const getAll = asyncHandler(async (req, res) => {

    const { productId, dateFrom, dateTo, type, reason, supplierId } = req.query;
    const establishmentId = req.user.establishmentId;

    const data = await stockMovementService.getMovements({
        productId,
        dateFrom,
        dateTo,
        type,
        reason,
        supplierId,
        establishmentId
    });

    res.json({
        success: true,
        data
    });

});

// 🔥 CONSUMO INTERNO
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

// 🎁 BONIFICAÇÃO (CORRETO)
const addBonus = async (req, res) => {

    try {

        const { productId, quantity, supplierId } = req.body;

        await stockMovementService.addBonus({
            productId,
            quantity,
            supplierId,
            establishmentId: req.user.establishmentId
        });

        return res.json({
            success: true,
            message: "Bonificação adicionada com sucesso"
        });

    } catch (error) {

        console.error(error);

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
    getAll,
    createInternalUse,
    addBonus // 🔥 IMPORTANTE EXPORTAR
};