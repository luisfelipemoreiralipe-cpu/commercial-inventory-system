const express = require('express');
const router = express.Router();
const requireRole = require('../middlewares/requireRole');

const supplierController = require('../controllers/supplierController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get(
    '/',
    authMiddleware,
    requireRole(['ADMIN', 'STOCK_COUNTER']),
    supplierController.getAll
);
router.get(
    '/',
    authMiddleware,
    requireRole(['ADMIN', 'STOCK_COUNTER']),
    supplierController.getAll
);
router.post(
    '/',
    authMiddleware,
    requireRole(['ADMIN']),
    supplierController.create
);
router.put(
    '/:id',
    authMiddleware,
    requireRole(['ADMIN']),
    supplierController.update
);

module.exports = router;
