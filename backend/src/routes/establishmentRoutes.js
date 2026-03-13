const { Router } = require('express');
const controller = require('../controllers/establishmentController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

router.get('/', authMiddleware, controller.getAll);

module.exports = router;