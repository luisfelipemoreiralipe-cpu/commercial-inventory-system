const prisma = require('../utils/prisma');


// ─── CREATE ─────────────────────────────────────────

const addSupplierToProduct = (productId, supplierId, price) =>
    prisma.productSupplier.create({
        data: {
            product: { connect: { id: productId } },
            supplier: { connect: { id: supplierId } },
            price: Number(price)
        },
        include: {
            supplier: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });


// ─── READ ───────────────────────────────────────────

const getSuppliersByProduct = (productId) =>
    prisma.productSupplier.findMany({
        where: { productId },
        include: {
            supplier: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });


// ─── DELETE ─────────────────────────────────────────

const removeSupplierFromProduct = (productId, supplierId) =>
    prisma.productSupplier.deleteMany({
        where: {
            productId,
            supplierId
        }
    });


module.exports = {
    addSupplierToProduct,
    getSuppliersByProduct,
    removeSupplierFromProduct
};