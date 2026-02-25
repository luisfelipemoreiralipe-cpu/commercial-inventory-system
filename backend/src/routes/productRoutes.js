const { Router } = require('express');
const controller = require('../controllers/productController');
const validate = require('../middlewares/validate');
const {
    createProductSchema,
    updateProductSchema,
    updateQuantitySchema,
} = require('../validations/productValidation');

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(createProductSchema), controller.create);
router.put('/:id', validate(updateProductSchema), controller.update);
router.delete('/:id', controller.remove);

// Manual stock quantity update (triggers movement + audit log)
router.patch('/:id/quantity', validate(updateQuantitySchema), controller.updateQuantity);

module.exports = router;
