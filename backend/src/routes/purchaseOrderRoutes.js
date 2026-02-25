const { Router } = require('express');
const controller = require('../controllers/purchaseOrderController');
const validate = require('../middlewares/validate');
const { createPurchaseOrderSchema } = require('../validations/purchaseOrderValidation');

const router = Router();

router.get('/', controller.getAll);
router.post('/', validate(createPurchaseOrderSchema), controller.create);
router.put('/:id/complete', controller.complete);
router.delete('/:id', controller.remove);

module.exports = router;
