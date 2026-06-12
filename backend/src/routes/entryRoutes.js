const { Router } = require('express');
const controller = require('../controllers/entryController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const router = Router();

// 📋 LISTAR LANÇAMENTOS → ADMIN ONLY
router.get(
    '/',
    authMiddleware,
    requireRole(['ADMIN']),
    controller.list
);

// 📊 RESUMO / KPIs → ADMIN ONLY
router.get(
    '/summary',
    authMiddleware,
    requireRole(['ADMIN']),
    controller.summary
);

// 🎯 CRIAR LANÇAMENTO → ADMIN ONLY
router.post(
    '/',
    authMiddleware,
    requireRole(['ADMIN']),
    controller.create
);

module.exports = router;
