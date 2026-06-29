const prisma = require('../config/prisma');

const findBySourceProductId = (sourceProductId, establishmentId) => {
    return prisma.portioningRecipe.findFirst({
        where: { 
            sourceProductId,
            establishmentId
        },
        include: {
            items: {
                include: {
                    targetProduct: true
                }
            },
            sourceProduct: true
        }
    });
};

const create = (data) => {
    return prisma.portioningRecipe.create({
        data
    });
};

const addItem = (data) => {
    return prisma.portioningRecipeItem.create({
        data
    });
};

const removeItem = (id, establishmentId) => {
    return prisma.portioningRecipeItem.deleteMany({
        where: { 
            id,
            portioningRecipe: {
                establishmentId
            }
        }
    });
};

const updateItemCostPercentage = (id, costAllocationPercentage, establishmentId) => {
    return prisma.portioningRecipeItem.updateMany({
        where: { 
            id,
            portioningRecipe: {
                establishmentId
            }
        },
        data: { costAllocationPercentage }
    });
};

const deleteRecipe = (recipeId, establishmentId) => {
    return prisma.portioningRecipe.deleteMany({
        where: { 
            id: recipeId,
            establishmentId
        }
    });
};

module.exports = {
    findBySourceProductId,
    create,
    addItem,
    removeItem,
    updateItemCostPercentage,
    deleteRecipe
};
