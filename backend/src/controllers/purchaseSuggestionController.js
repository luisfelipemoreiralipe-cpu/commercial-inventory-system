const purchaseSuggestionService = require('../services/purchaseSuggestionService');
const asyncHandler = require('../utils/asyncHandler');

const getSuggestions = asyncHandler(async (req, res) => {

    const data = await purchaseSuggestionService.getPurchaseSuggestions(
        req.user.establishmentId
    );

    res.json({
        success: true,
        data
    });

});

module.exports = {
    getSuggestions
};