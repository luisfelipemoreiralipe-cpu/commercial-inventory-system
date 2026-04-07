const { Router } = require('express');
const controller = require('../controllers/stockMovementController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');
const Roles = require('../constants/roles');
console.log('ROLES DEBUG:', Roles);

const router = Router();

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

// 🔥 BONUS → ADMIN ONLY (CRÍTICO)
router.post(
    '/bonus',
    authMiddleware,
    requireRole(['ADMIN']),
    controller.addBonus
);

module.exports = router;