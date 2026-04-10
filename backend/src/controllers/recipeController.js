const recipeService = require('../services/recipeService');

const createRecipe = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const establishmentId = req.user.establishmentId;

        const recipe = await recipeService.createRecipe(productId, establishmentId);
        res.status(201).json(recipe);

    } catch (error) {
        next(error);
    }
};

const addRecipeItem = async (req, res, next) => {
    try {
        const { recipeId, productId, quantity } = req.body;
        const establishmentId = req.user.establishmentId;

        const item = await recipeService.addRecipeItem(
            recipeId,
            productId,
            quantity,
            establishmentId
        );

        res.status(201).json(item);

    } catch (error) {
        next(error);
    }
};

const getRecipeByProduct = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const establishmentId = req.user.establishmentId;

        const recipe = await recipeService.getRecipeByProduct(productId, establishmentId);

        if (!recipe) {
            return res.status(404).json({ message: "Receita não encontrada" });
        }

        res.json(recipe);

    } catch (error) {
        next(error);
    }
};

const removeRecipeItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const establishmentId = req.user.establishmentId;

        const result = await recipeService.removeRecipeItem(id, establishmentId);
        res.json(result);

    } catch (error) {
        next(error);
    }
};

const calculateRecipeCost = async (req, res, next) => {
    try {
        const { recipeId } = req.params;
        const establishmentId = req.user.establishmentId;

        const cost = await recipeService.calculateRecipeCost(recipeId, establishmentId);
        res.json(cost);

    } catch (error) {
        next(error);
    }
};

const updateRecipeItemQuantity = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const establishmentId = req.user.establishmentId;

        const result = await recipeService.updateRecipeItemQuantity(
            id,
            quantity,
            establishmentId
        );

        res.json(result);

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createRecipe,
    addRecipeItem,
    getRecipeByProduct,
    removeRecipeItem,
    updateRecipeItemQuantity,
    calculateRecipeCost
};