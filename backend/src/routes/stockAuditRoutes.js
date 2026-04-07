const { Router } = require('express');
const controller = require('../controllers/stockAuditController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');
const Roles = require('../constants/roles.js');

const router = Router();
console.log("ROLES IMPORT:", Roles);


router.get(
    '/',
    authMiddleware,
    controller.list
);

router.post(
    '/',
    authMiddleware,
    requireRole(['ADMIN', 'MANAGER', 'STOCK_COUNTER']),
    controller.create
);

router.get(
    "/history",
    authMiddleware,
    controller.history
);

router.get(
    '/:id',
    authMiddleware,
    controller.getById
);

router.patch(
    '/:id/items',
    authMiddleware,
    controller.updateItems
);

router.patch(
    '/:id/finish',
    authMiddleware,
    controller.finish
);

module.exports = router;