const express = require('express');
const router = express.Router();
const requireRole = require('../middlewares/requireRole');
const authMiddleware = require('../middlewares/authMiddleware');
const controller = require('../controllers/stockTransferController');

router.post('/', authMiddleware, controller.createTransfer);

router.get(
    '/sent',
    authMiddleware,
    controller.getSentTransfers
);

router.get(
    '/received',
    authMiddleware,
    controller.getReceivedTransfers
);

router.patch(
    '/:id/approve',
    authMiddleware,
    requireRole(['ADMIN']),
    controller.approveTransfer
);

router.patch(
    '/:id/reject',
    authMiddleware,
    requireRole(['ADMIN']),
    controller.rejectTransfer
);

module.exports = router;