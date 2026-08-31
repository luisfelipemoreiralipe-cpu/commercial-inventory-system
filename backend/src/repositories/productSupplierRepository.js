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

const upsertSupplierToProduct = (productId, supplierId, price) =>
    prisma.productSupplier.upsert({
        where: {
            productId_supplierId: {
                productId,
                supplierId
            }
        },
        update: {
            price: Number(price)
        },
        create: {
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

const getSuppliersByProduct = (productId, establishmentId) =>
    prisma.productSupplier.findMany({
        where: {
            productId,
            product: { establishmentId },
            supplier: { establishmentId }
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


// ─── DELETE ─────────────────────────────────────────

const removeSupplierFromProduct = (productId, supplierId, establishmentId) =>
    prisma.productSupplier.deleteMany({
        where: {
            productId,
            supplierId,
            product: { establishmentId },
            supplier: { establishmentId }
        }
    });


module.exports = {
    addSupplierToProduct,
    upsertSupplierToProduct,
    getSuppliersByProduct,
    removeSupplierFromProduct
};
