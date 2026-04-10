const { Router } = require('express');
const controller = require('../controllers/establishmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');

const router = Router();

router.get('/', authMiddleware, controller.getAll);
router.post('/', authMiddleware, requireRole(['ADMIN']), controller.create);
router.put('/update/:id', authMiddleware, controller.update);


module.exports = router;