const stockMovementService = require('../services/stockMovementService');
const asyncHandler = require('../utils/asyncHandler');

// 🎯 CRIAR LANÇAMENTO
const create = asyncHandler(async (req, res) => {
    const { productId, quantity, entryType, notes } = req.body;
    const establishmentId = req.user.establishmentId;

    await stockMovementService.createEntry({
        productId,
        quantity: Number(quantity),
        entryType,
        notes,
        establishmentId
    });

    res.json({
        success: true,
        message: "Lançamento registrado com sucesso"
    });
});

// 📋 LISTAR LANÇAMENTOS (filtro por tipo/data)
const list = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo, entryType } = req.query;
    const establishmentId = req.user.establishmentId;

    const entryReasons = Object.values(stockMovementService.ENTRY_TYPES).map(t => t.reason);

    const data = await stockMovementService.getMovements({
        establishmentId,
        dateFrom,
        dateTo,
        type: 'OUT',
        reason: entryType || undefined
    });

    // Filtra apenas os reasons de entries
    const filtered = entryType
        ? data
        : data.filter(m => entryReasons.includes(m.reason));

    res.json({
        success: true,
        data: filtered
    });
});

// 📊 RESUMO / KPIs
const summary = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo } = req.query;
    const establishmentId = req.user.establishmentId;

    const result = await stockMovementService.getEntrySummary({
        establishmentId,
        dateFrom,
        dateTo
    });

    res.json({
        success: true,
        data: result
    });
});

module.exports = { create, list, summary };
