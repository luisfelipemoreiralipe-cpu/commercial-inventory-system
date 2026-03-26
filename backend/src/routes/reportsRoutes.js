const { Router } = require('express');
const controller = require('../controllers/reportsController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

router.get(
    '/purchase-savings',
    authMiddleware,
    controller.getPurchaseSavings
);

router.get(
    '/loss',
    authMiddleware,
    controller.getLoss
);
router.get(
    '/loss/by-product',
    authMiddleware,
    controller.getLossByProduct
);

module.exports = router; // ⚠️ tem que ser exatamente isso