const { Router } = require('express');
const controller = require('../controllers/productController');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/authMiddleware');
const {
    createProductSchema,
    updateProductSchema,
    updateQuantitySchema,
} = require('../validations/productValidation');

const router = Router();

router.get('/', authMiddleware, controller.getAll);
router.get('/:id', authMiddleware, controller.getById);
router.post('/', authMiddleware, validate(createProductSchema), controller.create);
router.put('/:id', authMiddleware, validate(updateProductSchema), controller.update);
router.delete('/:id', authMiddleware, controller.remove);
router.patch('/:id/quantity', authMiddleware, validate(updateQuantitySchema), controller.updateQuantity);

// Manual stock quantity update (triggers movement + audit log)
router.patch('/:id/quantity', validate(updateQuantitySchema), controller.updateQuantity);

module.exports = router;
