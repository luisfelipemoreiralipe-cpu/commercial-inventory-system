const recipeRepo = require('../repositories/recipeRepository');
const AppError = require('../utils/AppError');
const productRepo = require('../repositories/productRepository');
const prisma = require('../config/prisma');

/**
 * 🔐 CRIAR FICHA TÉCNICA
 */
const createRecipe = async (productId, establishmentId) => {

    const existing = await recipeRepo.findByProductId(productId, establishmentId);

    if (existing) {
        throw new AppError('Este produto já possui ficha técnica.', 400);
    }

    // Valida que o produto pertence ao tenant
    const product = await productRepo.findByIdAndEstablishment(productId, establishmentId);
    if (!product) {
        throw new AppError('Produto não encontrado ou acesso negado.', 404);
    }

    const recipe = await recipeRepo.create({
        productId,
        establishmentId
    });

    return recipe;
};

/**
 * 🔐 ADICIONAR ITEM À FICHA
 */
const addRecipeItem = async (recipeId, productId, quantity, establishmentId) => {

    if (!quantity || quantity <= 0) {
        throw new AppError('Quantidade inválida.', 400);
    }

    // 🛡️ Valida que a receita pertence ao tenant
    const recipeCheck = await prisma.recipe.findFirst({
        where: { id: recipeId, establishmentId }
    });

    if (!recipeCheck) {
        throw new AppError('Ficha técnica não encontrada ou acesso negado.', 404);
    }

    const item = await recipeRepo.addItem({
        recipeId,
        productId,
        quantity
    });

    return item;
};

/**
 * 🔐 REMOVER ITEM DA FICHA
 */
const removeRecipeItem = async (id, establishmentId) => {

    // O repositório já deve filtrar por tenant nas relações
    const removed = await recipeRepo.removeItem(id, establishmentId);

    if (removed.count === 0) {
        throw new AppError('Ingrediente não encontrado ou acesso negado.', 404);
    }

    return { success: true };
};

/**
 * 🔐 ATUALIZAR QUANTIDADE DO INGREDIENTE
 */
const updateRecipeItemQuantity = async (id, quantity, establishmentId) => {

    if (!quantity || quantity <= 0) {
        throw new AppError('Quantidade inválida.', 400);
    }

    const updated = await recipeRepo.updateItemQuantity(id, quantity, establishmentId);

    if (updated.count === 0) {
        throw new AppError('Ingrediente não encontrado ou acesso negado.', 404);
    }

    return { success: true };
};

/**
 * 🔐 BUSCAR POR PRODUTO
 */
const getRecipeByProduct = async (productId, establishmentId) => {
    const recipe = await recipeRepo.findByProductWithItems(productId, establishmentId);
    return recipe || null;
};

/**
 * 🔐 CALCULAR CUSTO DA FICHA
 */
const calculateRecipeCost = async (recipeId, establishmentId) => {

    const items = await recipeRepo.findItemsWithProductPrice(recipeId, establishmentId);

    let totalCost = 0;
    const ingredients = [];

    for (const item of items) {
        const product = item.product;
        const packQuantity = Number(product.packQuantity || 1);
        
        // 🛡️ Força tenant no histórico de preços
        const price = await productRepo.getLastPurchasePrice(item.productId, establishmentId);

        const quantity = Number(item.quantity);

        // Custo do item = quantidade usada * (preço do pacote / quantidade no pacote)
        const cost = quantity * (price / packQuantity);

        totalCost += cost;

        ingredients.push({
            id: item.id,
            productId: item.productId,
            name: product.name,
            quantity,
            unit: product.unit,
            unitPrice: price,
            cost
        });
    }

    return {
        recipeId,
        ingredients,
        totalCost
    };
};

module.exports = {
    createRecipe,
    addRecipeItem,
    getRecipeByProduct,
    removeRecipeItem,
    updateRecipeItemQuantity,
    calculateRecipeCost
};