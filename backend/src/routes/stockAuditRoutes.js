const { Router } = require('express');
const controller = require('../controllers/stockAuditController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

router.get(
    '/',
    authMiddleware,
    controller.list
);

router.post(
    '/',
    authMiddleware,
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