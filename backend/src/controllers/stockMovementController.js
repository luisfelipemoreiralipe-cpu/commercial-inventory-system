const stockMovementService = require('../services/stockMovementService');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
    const { productId, dateFrom, dateTo } = req.query;
    const data = await stockMovementService.getMovements({ productId, dateFrom, dateTo });
    res.json({ success: true, data });
});

module.exports = { getAll };
