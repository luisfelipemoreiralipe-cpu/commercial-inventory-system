const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);


// Rota protegida
router.get('/me', authMiddleware, authController.me);
router.post(
    "/switch-establishment",
    authMiddleware,
    authController.switchEstablishment
);

module.exports = router;