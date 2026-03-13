const { Router } = require('express');
const controller = require('../controllers/stockTransferController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

router.post('/stock-transfers', authMiddleware, controller.createTransfer);

module.exports = router;