const express = require('express');
const router = express.Router();

const recipeController = require('../controllers/recipeController');
const authMiddleware = require('../middlewares/authMiddleware');

// todas as rotas de receita exigem usuário autenticado
router.use(authMiddleware);

// criar receita
router.post('/', recipeController.createRecipe);

// adicionar item na receita
router.post('/items', recipeController.addRecipeItem);

// buscar receita pelo produto
router.get('/product/:productId', recipeController.getRecipeByProduct);

// calcular custo da receita
router.get('/cost/:recipeId', recipeController.calculateRecipeCost);

// remover item da receita
router.delete('/items/:id', recipeController.removeRecipeItem);

// atualizar quantidade de ingrediente
router.patch('/items/:id', recipeController.updateRecipeItemQuantity);

module.exports = router;