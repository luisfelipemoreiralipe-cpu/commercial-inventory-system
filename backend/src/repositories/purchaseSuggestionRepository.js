const prisma = require('../utils/prisma');

// ─── PRODUCTS BELOW MINIMUM ─────────────────────────

const getProductsBelowMinimum = async (establishmentId) => {

    return prisma.product.findMany({
        where: {
            establishmentId,
            type: { not: "ASSET" },
            trackInventory: true,
            purchaseClassification: { not: "EXCLUDED" },
            OR: [
                {
                    purchaseClassification: "CMV_BEVERAGES",
                    quantity: { lt: prisma.product.fields.minQuantity }
                },
                {
                    purchaseClassification: { in: ["CLEANING", "DISPOSABLES", "OPERATING"] },
                    quantity: { lt: prisma.product.fields.idealQuantity }
                }
            ]
        },

        select: {
            id: true,
            name: true,
            unit: true,
            quantity: true,
            minQuantity: true,
            purchaseUnit: true,
            packQuantity: true,
            purchaseClassification: true,
            restockFrequency: true,
            idealQuantity: true,
            responsibleSector: true,

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
