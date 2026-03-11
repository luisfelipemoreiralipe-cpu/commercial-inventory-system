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

router.get('/:id/cmv', authMiddleware, controller.getCMV);

// ─── PRICE HISTORY ─────────────────────────────────────────────────────
router.get('/:id/price-history', authMiddleware, controller.getPriceHistory);

// ─── BEST SUPPLIER ─────────────────────────────────────────────────────
router.get('/:id/best-supplier', authMiddleware, controller.getBestSupplier);

// ─── SUPPLIER COMPARISON ───────────────────────────────────────────────
router.get('/:id/supplier-comparison', authMiddleware, controller.getSupplierComparison);

// ─── PRODUCT SUPPLIERS ─────────────────────────────────────────────────

// listar fornecedores do produto
router.get('/:id/suppliers', authMiddleware, controller.getSuppliers);

// adicionar fornecedor ao produto
router.post('/:id/suppliers', authMiddleware, controller.addSupplier);

// remover fornecedor do produto
router.delete(
    '/:productId/suppliers/:supplierId',
    authMiddleware,
    controller.removeSupplier
);

router.get('/:id', authMiddleware, controller.getById);

router.post(
    '/',
    authMiddleware,
    validate(createProductSchema),
    controller.create
);

router.put(
    '/:id',
    authMiddleware,
    validate(updateProductSchema),
    controller.update
);

router.delete('/:id', authMiddleware, controller.remove);

router.patch(
    '/:id/quantity',
    authMiddleware,
    validate(updateQuantitySchema),
    controller.updateQuantity
);

module.exports = router;