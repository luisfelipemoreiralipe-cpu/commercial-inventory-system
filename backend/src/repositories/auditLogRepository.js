const prisma = require('../utils/prisma');

/**
 * @param {object} filters
 * @param {string} [filters.entityType] "PRODUCT" | "SUPPLIER" | "PURCHASE_ORDER"
 */
const findAll = ({ entityType } = {}) => {
    const where = {};
    if (entityType) where.entityType = entityType;

    return prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });
};

const create = (data) =>
    prisma.auditLog.create({ data });

module.exports = { findAll, create };
