const prisma = require('../utils/prisma');

// ─── PRODUCTS BELOW MINIMUM ─────────────────────────

const getProductsBelowMinimum = (establishmentId) =>
    prisma.product.findMany({
        where: {
            establishmentId,
            quantity: {
                lte: prisma.product.fields.minQuantity
            }
        },
        include: {
            category: true,
            productSuppliers: {
                include: {
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

module.exports = {
    getProductsBelowMinimum
};