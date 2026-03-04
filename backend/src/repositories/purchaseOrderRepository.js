const prisma = require('../utils/prisma');

const findAll = () =>
    prisma.purchaseOrder.findMany({
        include: {
            items: {
                include: {
                    product: { select: { id: true, name: true, unit: true } },
                    supplier: { select: { id: true, name: true } }
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

const findById = (id) =>
    prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    product: { select: { id: true, name: true, unit: true } },
                    supplier: { select: { id: true, name: true } }
                },
            },
        },
    });

const create = async (data) => {

    if (!data.user_id) {
        throw new Error("user_id não informado na criação da ordem.");
    }

    // Buscar fornecedores automaticamente a partir dos produtos
    const itemsWithSupplier = await Promise.all(
        data.items.map(async (item) => {

            let supplierId = item.supplierId;

            if (!supplierId && item.productId) {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    select: { supplierId: true }
                });

                supplierId = product?.supplierId || null;
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

    return prisma.purchaseOrder.create({
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
                    supplier: true
                }
            }
        }
    });
};

const markCompleted = (id) =>
    prisma.purchaseOrder.update({
        where: { id },
        data: { status: 'completed', completedAt: new Date() },
        include: { items: true },
    });

const remove = (id) =>
    prisma.purchaseOrder.delete({ where: { id } });

module.exports = { findAll, findById, create, markCompleted, remove };