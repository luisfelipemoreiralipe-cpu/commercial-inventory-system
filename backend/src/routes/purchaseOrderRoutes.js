const { Router } = require('express');
const controller = require('../controllers/purchaseOrderController');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/authMiddleware');
const { createPurchaseOrderSchema } = require('../validations/purchaseOrderValidation');

const router = Router();

router.get('/', authMiddleware, controller.getAll);

router.post(
    '/',
    authMiddleware,
    validate(createPurchaseOrderSchema),
    controller.create
);

router.put('/:id/complete', authMiddleware, controller.complete);

router.get('/:id/pdf', authMiddleware, controller.exportPdf);

router.delete('/:id', authMiddleware, controller.remove);

module.exports = router;