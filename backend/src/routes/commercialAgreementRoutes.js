const { Router } = require('express');
const controller = require('../controllers/commercialAgreementController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const router = Router();
router.use(authMiddleware);
router.get('/', controller.list);
router.get('/summary', controller.summary);
router.post('/', requireRole(['ADMIN']), controller.create);
router.post('/bonus-receipts', requireRole(['ADMIN', 'STOCK_COUNTER']), controller.receiveBonus);

module.exports = router;
