const productService = require('../services/productService');
const asyncHandler = require('../utils/asyncHandler');

// ─── PURCHASE SAVINGS REPORT ───────────────────────────────────────────

const getPurchaseSavings = asyncHandler(async (req, res) => {

    const data = await productService.getPurchaseSavings(
        req.user.establishmentId
    );

    res.json({
        success: true,
        data
    });

});

module.exports = {
    getPurchaseSavings
};