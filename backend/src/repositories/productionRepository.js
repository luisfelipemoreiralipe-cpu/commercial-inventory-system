const prisma = require('../config/prisma');

/**
 * Cria uma nova ordem de produção
 */
const create = async ({ productId, quantity, notes, establishmentId, createdBy }) => {
    return prisma.productionOrder.create({
        data: {
            productId,
            quantity,
            notes,
            establishmentId,
            createdBy,
            status: 'PENDING'
        },
        include: {
            product: { select: { id: true, name: true, unit: true } },
            user: { select: { id: true, name: true } }
        }
    });
};

/**
 * Lista ordens de produção do estabelecimento com paginação e filtro de status
 */
const findAll = async ({ establishmentId, status, page = 1, limit = 20 }) => {
    const where = { establishmentId };
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
        prisma.productionOrder.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                product: { select: { id: true, name: true, unit: true } },
                user: { select: { id: true, name: true } }
            }
        }),
        prisma.productionOrder.count({ where })
    ]);

    return { orders, total, page, limit };
};

/**
 * Busca uma ordem específica com detalhes completos
 */
const findById = async (id, establishmentId) => {
    return prisma.productionOrder.findFirst({
        where: { id, establishmentId },
        include: {
            product: {
                select: { id: true, name: true, unit: true, quantity: true },
                include: {
                    Recipe: {
                        include: {
                            items: {
                                include: {
                                    product: {
                                        select: { id: true, name: true, unit: true, quantity: true, currentCost: true }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            user: { select: { id: true, name: true } }
        }
    });
};

/**
 * Atualiza o status de uma ordem
 */
const updateStatus = async (id, establishmentId, status, completedAt = null) => {
    return prisma.productionOrder.updateMany({
        where: { id, establishmentId },
        data: {
            status,
            ...(completedAt && { completedAt })
        }
    });
};

module.exports = {
    create,
    findAll,
    findById,
    updateStatus
};
