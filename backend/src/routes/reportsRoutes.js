const { Router } = require('express');
const controller = require('../controllers/reportsController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

router.get(
    '/purchase-savings',
    authMiddleware,
    controller.getPurchaseSavings
);

module.exports = router; // ⚠️ tem que ser exatamente isso