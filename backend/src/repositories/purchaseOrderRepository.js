const prisma = require('../utils/prisma');

// ─── FIND ALL ─────────────────────────────────────────

const findAll = () =>
    prisma.purchaseOrder.findMany({
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            unit: true
                        }
                    },
                    supplier: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });


// ─── FIND BY ID ──────────────────────────────────────

const findById = (id) =>
    prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            unit: true
                        }
                    },
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


// ─── CREATE ORDER ─────────────────────────────────────

const create = async (data) => {

    if (!data.user_id) {
        throw new Error("user_id não informado na criação da ordem.");
    }

    const itemsWithSupplier = await Promise.all(
        data.items.map(async (item) => {

            let supplierId = item.supplierId;

            // Se não veio fornecedor do frontend
            if (!supplierId && item.productId) {

                const productSupplier = await prisma.productSupplier.findFirst({
                    where: { productId: item.productId },
                    select: { supplierId: true }
                });

                supplierId = productSupplier?.supplierId || null;
            }

            return {
                productId: item.productId,
                productName: item.productName,
                adjustedQuantity: item.adjustedQuantity,
                unitPrice: item.unitPrice,
                supplierId
            };
        })
    );

    const order = await prisma.purchaseOrder.create({
        data: {
            status: 'pending',

            users: {
                connect: { id: data.user_id }
            },

            items: {
                create: itemsWithSupplier
            }
        },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            unit: true
                        }
                    },
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

    // 🔹 Derivar fornecedor da ordem pelo primeiro item
    const firstSupplier = order.items?.[0]?.supplier || null;

    return {
        ...order,
        supplier: firstSupplier
    };
};


// ─── MARK COMPLETED ───────────────────────────────────

const markCompleted = (id) =>
    prisma.purchaseOrder.update({
        where: { id },
        data: {
            status: 'completed',
            completedAt: new Date()
        },
        include: { items: true }
    });


// ─── DELETE ORDER ─────────────────────────────────────

const remove = (id) =>
    prisma.purchaseOrder.delete({
        where: { id }
    });


module.exports = {
    findAll,
    findById,
    create,
    markCompleted,
    remove
};