const { Router } = require('express');
const controller = require('../controllers/purchaseOrderController');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');
const { createPurchaseOrderSchema } = require('../validations/purchaseOrderValidation');

const router = Router();

// 🔓 LISTAR → ADMIN + STOCK_COUNTER
router.get(
    '/',
    authMiddleware,
    requireRole(['ADMIN', 'STOCK_COUNTER']),
    controller.getAll
);

// 🔒 CRIAR → só ADMIN
router.post(
    '/',
    authMiddleware,
    requireRole(['ADMIN']),
    validate(createPurchaseOrderSchema),
    controller.create
);

// 🔓 RECEBER (complete) → ADMIN + STOCK_COUNTER
router.put(
    '/:id/complete',
    authMiddleware,
    requireRole(['ADMIN', 'STOCK_COUNTER']),
    controller.complete
);

// 🔓 PDF → ADMIN + STOCK_COUNTER
router.get(
    '/:id/pdf',
    authMiddleware,
    requireRole(['ADMIN', 'STOCK_COUNTER']),
    controller.exportPdf
);

// 🔒 DELETAR → só ADMIN
router.delete(
    '/:id',
    authMiddleware,
    requireRole(['ADMIN']),
    controller.remove
);

module.exports = router;