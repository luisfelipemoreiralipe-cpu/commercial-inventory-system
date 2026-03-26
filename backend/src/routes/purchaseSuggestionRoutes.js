const express = require('express');
const router = express.Router();

const purchaseSuggestionController = require('../controllers/purchaseSuggestionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get(
    '/purchase-suggestions',
    authMiddleware,
    purchaseSuggestionController.getSuggestions
);

module.exports = router;