const { Router } = require('express');
const controller = require('../controllers/productController');
const validate = require('../middlewares/validate');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');
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
router.post('/:id/suppliers', authMiddleware, requireRole(['ADMIN']), controller.addSupplier);

// remover fornecedor do produto
router.delete(
    '/:productId/suppliers/:supplierId',
    authMiddleware,
    requireRole(['ADMIN']),
    controller.removeSupplier
);

router.get('/:id', authMiddleware, controller.getById);

router.post(
    '/',
    authMiddleware,
    requireRole(['ADMIN']),
    validate(createProductSchema),
    controller.create
);

router.put(
    '/:id',
    authMiddleware,
    requireRole(['ADMIN']),
    validate(updateProductSchema),
    controller.update
);

router.delete('/:id', authMiddleware, requireRole(['ADMIN']), controller.remove);

router.patch(
    '/:id/quantity',
    authMiddleware,
    requireRole(['ADMIN']),
    validate(updateQuantitySchema),
    controller.updateQuantity
);

module.exports = router;
