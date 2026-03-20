const { Router } = require('express');
const controller = require('../controllers/stockMovementController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

// 🔍 LISTAR MOVIMENTAÇÕES
router.get('/', authMiddleware, controller.getAll);

// 🔥 NOVO: CONSUMO INTERNO
router.post('/internal-use', authMiddleware, controller.createInternalUse);

module.exports = router;