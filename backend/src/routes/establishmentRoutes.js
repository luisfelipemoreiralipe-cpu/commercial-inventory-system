const { Router } = require('express');
const controller = require('../controllers/establishmentController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = Router();

router.get('/', authMiddleware, controller.getAll);
router.put('/update/:id', authMiddleware, controller.update);


module.exports = router;