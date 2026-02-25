const prisma = require('../utils/prisma');

const findAll = () =>
    prisma.purchaseOrder.findMany({
        include: {
            items: {
                include: {
                    product: { select: { id: true, name: true, unit: true } },
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
                },
            },
        },
    });

const create = (data) =>
    prisma.purchaseOrder.create({
        data: {
            items: {
                create: data.items.map((item) => ({
                    productId: item.productId,
                    productName: item.productName,
                    adjustedQuantity: item.adjustedQuantity,
                    unitPrice: item.unitPrice,
                })),
            },
        },
        include: { items: true },
    });

const markCompleted = (id) =>
    prisma.purchaseOrder.update({
        where: { id },
        data: { status: 'completed', completedAt: new Date() },
        include: { items: true },
    });

const remove = (id) =>
    prisma.purchaseOrder.delete({ where: { id } });

module.exports = { findAll, findById, create, markCompleted, remove };
