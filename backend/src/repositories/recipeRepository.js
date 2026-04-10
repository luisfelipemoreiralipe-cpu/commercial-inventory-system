const prisma = require('../config/prisma');

const findByProductId = (productId, establishmentId) => {
    return prisma.recipe.findFirst({
        where: { 
            productId,
            establishmentId
        }
    });
};

const create = (data) => {
    return prisma.recipe.create({
        data
    });
};

const addItem = (data) => {
    return prisma.recipeItem.create({
        data
    });
};

const removeItem = (id, establishmentId) => {
    return prisma.recipeItem.deleteMany({
        where: { 
            id,
            recipe: {
                establishmentId
            }
        }
    });
};

const updateItemQuantity = (id, quantity, establishmentId) => {
    return prisma.recipeItem.updateMany({
        where: { 
            id,
            recipe: {
                establishmentId
            }
        },
        data: { quantity }
    });
};

const findItemsWithProductPrice = (recipeId, establishmentId) => {
    return prisma.recipeItem.findMany({
        where: { 
            recipeId,
            recipe: {
                establishmentId
            }
        },
        include: {
            product: true
        }
    });
};

const countItemsByRecipe = (recipeId, establishmentId) => {
    return prisma.recipeItem.count({
        where: { 
            recipeId,
            recipe: {
                establishmentId
            }
        }
    });
};

const deleteRecipe = (recipeId, establishmentId) => {
    return prisma.recipe.deleteMany({
        where: { 
            id: recipeId,
            establishmentId
        }
    });
};


const findByProductWithItems = (productId, establishmentId) => {
    return prisma.recipe.findFirst({
        where: { 
            productId,
            establishmentId
        },
        include: {
            items: {
                include: {
                    product: true
                }
            }
        }
    });
};

module.exports = {
    findByProductId,
    findByProductWithItems,
    create,
    addItem,
    removeItem,
    updateItemQuantity,
    findItemsWithProductPrice,
    countItemsByRecipe,
    deleteRecipe
};