const prisma = require('../utils/prisma');

/**
 * @param {object} filters
 * @param {string} [filters.productId]
 * @param {string} [filters.dateFrom]  ISO string
 * @param {string} [filters.dateTo]    ISO string
 */
const findAll = ({ productId, dateFrom, dateTo, type, reason, supplierId, establishmentId } = {}) => {
    const where = {};
    if (establishmentId) where.establishmentId = establishmentId;

    if (productId) {
        where.product = {
            id: productId
        };
    }

    if (type === 'IN' && reason === 'BONUS') {
        where.OR = [
            { type: 'IN', reason: 'BONUS' },
            { type: 'BONUS' }
        ];
    } else {
        if (type) where.type = type;
        if (reason) where.reason = reason;
    }

    if (supplierId) where.supplierId = supplierId;

    if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }

    return prisma.stockMovement.findMany({
        where,
        include: {
            product: { select: { id: true, name: true, unit: true } },
            supplier: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
};

const create = (data) =>
    prisma.stockMovement.create({ data });

module.exports = { findAll, create };
