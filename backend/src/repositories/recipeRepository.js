const prisma = require('../config/prisma');

const findByProductId = (productId) => {
    return prisma.recipe.findUnique({
        where: { productId }
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

const removeItem = (id) => {
    return prisma.recipeItem.delete({
        where: { id }
    });
};

const updateItemQuantity = (id, quantity) => {
    return prisma.recipeItem.update({
        where: { id },
        data: { quantity }
    });
};

const findItemsWithProductPrice = (recipeId) => {
    return prisma.recipeItem.findMany({
        where: { recipeId },
        include: {
            product: true
        }
    });
};

const findByProductWithItems = (productId) => {
    return prisma.recipe.findUnique({
        where: { productId },
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
    findItemsWithProductPrice
};