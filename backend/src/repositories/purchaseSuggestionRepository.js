const prisma = require('../utils/prisma');

// ─── PRODUCTS BELOW MINIMUM ─────────────────────────

const getProductsBelowMinimum = async (establishmentId) => {

    return prisma.product.findMany({
        where: {
            establishmentId,
            quantity: {
                lt: prisma.product.fields.minQuantity
            }
        },

        select: {
            id: true,
            name: true,
            unit: true,
            quantity: true,
            minQuantity: true,

            category: {
                select: {
                    id: true,
                    name: true
                }
            },

            productSuppliers: {
                select: {
                    price: true,
                    supplier: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }
        }

    });

};

module.exports = {
    getProductsBelowMinimum
};