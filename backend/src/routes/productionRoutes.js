const express = require('express');
const router = express.Router();

const productionController = require('../controllers/productionController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Preview de insumos necessários (sem alterar estoque)
router.get('/preview', productionController.previewProduction);

// Estatísticas de produção
router.get('/stats', productionController.getProductionStats);

// Listar ordens de produção
router.get('/', productionController.listProductionOrders);

// Criar nova ordem de produção
router.post('/', productionController.createProductionOrder);

// Concluir produção (baixa insumos + entrada produto)
router.patch('/:id/complete', productionController.completeProductionOrder);

// Cancelar ordem pendente
router.patch('/:id/cancel', productionController.cancelProductionOrder);

module.exports = router;
