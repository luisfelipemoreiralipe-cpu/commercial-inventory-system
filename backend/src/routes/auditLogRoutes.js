const { Router } = require('express');
const controller = require('../controllers/auditLogController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.get(
    '/',
    authMiddleware,
    requireRole(['ADMIN']),
    controller.getAll
);

module.exports = router;
