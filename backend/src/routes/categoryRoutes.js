const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const categoryController = require('../controllers/categoryController');

router.get('/', authMiddleware, categoryController.getAllCategories);

module.exports = router;