const { Router } = require('express');
const controller = require('../controllers/stockMovementController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');
const Roles = require('../constants/roles');
const validate = require('../middlewares/validate');
const { operationalUseSchema, beverageOperationalUseSchema } = require('../validations/operationalUseValidation');
console.log('ROLES DEBUG:', Roles);

const router = Router();

router.post(
    '/beverage-operational-use',
    authMiddleware,
    requireRole(['ADMIN']),
    validate(beverageOperationalUseSchema),
    controller.createBeverageOperationalUse
);

// 🔍 LISTAR MOVIMENTAÇÕES → ADMIN ONLY
router.get(
    '/',
    authMiddleware,
    requireRole(['ADMIN']),
    controller.getAll
);

// 🔥 CONSUMO INTERNO → ADMIN ONLY
router.post(
    '/internal-use',
    authMiddleware,
    requireRole(['ADMIN']),
    controller.createInternalUse
);

// 🍹 CONSUMO OPERACIONAL → ADMIN ONLY
router.post(
    '/operational-use',
    authMiddleware,
    requireRole(['ADMIN']),
    validate(operationalUseSchema),
    controller.createOperationalUse
);

// 🔥 BONUS → ADMIN ONLY (CRÍTICO)
router.post(
    '/bonus',
    authMiddleware,
    requireRole(['ADMIN']),
    controller.addBonus
);

module.exports = router;
