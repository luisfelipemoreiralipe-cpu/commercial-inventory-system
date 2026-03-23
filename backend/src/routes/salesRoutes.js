const express = require('express');
const router = express.Router();

const upload = require('../middlewares/upload');
const salesController = require('../controllers/salesController');
const authMiddleware = require('../middlewares/authMiddleware'); // 👈 IMPORTANTE

// 🔥 IMPORTAÇÃO CSV
router.post(
    '/import',
    authMiddleware,            // 👈 AQUI
    upload.single('file'),
    salesController.importCSV
);

module.exports = router;