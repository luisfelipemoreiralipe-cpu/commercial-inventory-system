const express = require('express');
const router = express.Router();

const supplierController = require('../controllers/supplierController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, supplierController.getAll);
router.post('/', authMiddleware, supplierController.create);
router.put('/:id', authMiddleware, supplierController.update);
router.delete('/:id', authMiddleware, supplierController.remove);

module.exports = router;
