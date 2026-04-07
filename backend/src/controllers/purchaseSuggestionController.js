const purchaseSuggestionService = require('../services/purchaseSuggestionService');
const asyncHandler = require('../utils/asyncHandler');

const getSuggestions = asyncHandler(async (req, res) => {

    const days = Number(req.query.days) || 7;

    const data = await purchaseSuggestionService.getPurchaseSuggestions(
        req.user.establishmentId,
        days
    );

    res.json({
        success: true,
        data
    });

});

module.exports = {
    getSuggestions
};