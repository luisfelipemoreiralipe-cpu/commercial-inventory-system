const prisma = require('../utils/prisma');

// ─── READ ──────────────────────────────────────────────────────────────
const findAllByEstablishment = (establishmentId) =>
    prisma.product.findMany({
        where: { establishmentId },
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
        },
        orderBy: { name: 'asc' },
    });

const findByIdAndEstablishment = (id, establishmentId) =>
    prisma.product.findFirst({
        where: {
            id,
            establishmentId,
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
        },
    });

// ─── CREATE ─────────────────────────────────────────────────────────────
const create = (data) =>
    prisma.product.create({
        data: {
            name: data.name,
            unit: data.unit,
            unitPrice: data.unitPrice,
            quantity: data.quantity,
            minQuantity: data.minQuantity,

            category: {
                connect: { id: data.categoryId }
            },

            supplier: {
                connect: { id: data.supplierId }
            },

            establishment: {
                connect: { id: data.establishmentId }
            }
        }
    });

// ─── UPDATE ─────────────────────────────────────────────────────────────
const updateByEstablishment = (id, establishmentId, data) =>
    prisma.product.updateMany({
        where: {
            id,
            establishmentId,
        },
        data,
    }).then(async (result) => {
        if (result.count === 0) return null;

        return prisma.product.findFirst({
            where: { id, establishmentId },
            include: {
                supplier: { select: { id: true, name: true } },
                category: true,
            },
        });
    });

// ─── DELETE ─────────────────────────────────────────────────────────────
const removeByEstablishment = (id, establishmentId) =>
    prisma.product.deleteMany({
        where: {
            id,
            establishmentId,
        },
    });

// ─── PRICE HISTORY ─────────────────────────────────────────────────────
const getPriceHistory = (productId) =>
    prisma.purchaseOrderItem.findMany({
        where: {
            productId
        },
        select: {
            unitPrice: true,
            adjustedQuantity: true,
            createdAt: true,
            supplier: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

// ─── PRODUCT SUPPLIERS ───────────────────────────────────────────────

const addSupplierToProduct = (productId, supplierId) =>
    prisma.productSupplier.create({
        data: {
            product: { connect: { id: productId } },
            supplier: { connect: { id: supplierId } }
        },
        include: {
            supplier: { select: { id: true, name: true } }
        }
    });

const getSuppliersByProduct = (productId) =>
    prisma.productSupplier.findMany({
        where: { productId },
        include: {
            supplier: { select: { id: true, name: true } }
        }
    });

const removeSupplierFromProduct = (productId, supplierId) =>
    prisma.productSupplier.deleteMany({
        where: {
            productId,
            supplierId
        }
    });
module.exports = {
    findAllByEstablishment,
    findByIdAndEstablishment,
    create,
    updateByEstablishment,
    removeByEstablishment,
    getPriceHistory,
    addSupplierToProduct,
    getSuppliersByProduct,
    removeSupplierFromProduct,
};