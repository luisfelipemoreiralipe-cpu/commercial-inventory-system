const recipeRepo = require('../repositories/recipeRepository');
const AppError = require('../utils/AppError');
const productRepo = require('../repositories/productRepository');
const createRecipe = async (productId, establishmentId) => {

    const existing = await recipeRepo.findByProductId(productId, establishmentId);

    if (existing) {
        throw new AppError('Este produto já possui ficha técnica.', 400);
    }

    const recipe = await recipeRepo.create({
        productId,
        establishmentId
    });

    return recipe;

};

const addRecipeItem = async (recipeId, productId, quantity) => {

    if (!quantity || quantity <= 0) {
        throw new AppError('Quantidade inválida.', 400);
    }

    const item = await recipeRepo.addItem({
        recipeId,
        productId,
        quantity
    });

    return item;

};

const removeRecipeItem = async (id) => {

    const removed = await recipeRepo.removeItem(id);

    if (!removed) {
        throw new AppError('Ingrediente não encontrado.', 404);
    }

    const recipeId = removed.recipeId;

    const remaining = await recipeRepo.countItemsByRecipe(recipeId);

    if (remaining === 0) {
        await recipeRepo.deleteRecipe(recipeId);
    }

    return removed;
};

const updateRecipeItemQuantity = async (id, quantity) => {

    if (!quantity || quantity <= 0) {
        throw new AppError('Quantidade inválida.', 400);
    }

    const updated = await recipeRepo.updateItemQuantity(id, quantity);

    return updated;
};

const getRecipeByProduct = async (productId) => {

    const recipe = await recipeRepo.findByProductWithItems(productId);

    return recipe || null;

};

const calculateRecipeCost = async (recipeId) => {

    const items = await recipeRepo.findItemsWithProductPrice(recipeId);

    let totalCost = 0;

    const ingredients = [];

    for (const item of items) {

        const price = await productRepo.getLastPurchasePrice(item.productId);

        const quantity = Number(item.quantity);

        const cost = price * quantity;

        totalCost += cost;

        ingredients.push({
            id: item.id,
            productId: item.productId,
            name: item.product.name,
            quantity,
            unit: item.product.unit,
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