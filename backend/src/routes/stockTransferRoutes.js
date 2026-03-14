const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const controller = require('../controllers/stockTransferController');

router.post('/stock-transfers', authMiddleware, controller.createTransfer);

router.get(
    '/stock-transfers/sent',
    authMiddleware,
    controller.getSentTransfers
);

router.get(
    '/stock-transfers/received',
    authMiddleware,
    controller.getReceivedTransfers
);

router.patch(
    '/stock-transfers/:id/approve',
    authMiddleware,
    controller.approveTransfer
);

router.patch(
    '/stock-transfers/:id/reject',
    authMiddleware,
    controller.rejectTransfer
);

module.exports = router;