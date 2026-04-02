const express = require('express');
const router = express.Router();
const requireRole = require('../middlewares/requireRole');
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

// router.patch(
//     '/stock-transfers/:id/complete',
//     authMiddleware,
//     controller.completeTransfer
// );

router.patch(
    '/stock-transfers/:id/approve',
    authMiddleware,
    requireRole(['ADMIN']),
    controller.approveTransfer
);

router.patch(
    '/stock-transfers/:id/reject',
    authMiddleware,
    requireRole(['ADMIN']),
    controller.rejectTransfer
);
module.exports = router;