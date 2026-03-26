<<<<<<< HEAD
const { Router } = require('express');
const controller = require('../controllers/authController');


const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
=======
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
router.get(
    "/context",
    authMiddleware,
    authController.context
);
>>>>>>> feature/purchase-intelligence

module.exports = router;