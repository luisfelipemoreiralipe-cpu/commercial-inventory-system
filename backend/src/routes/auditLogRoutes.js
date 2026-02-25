const { Router } = require('express');
const controller = require('../controllers/auditLogController');

const router = Router();

router.get('/', controller.getAll);

module.exports = router;
