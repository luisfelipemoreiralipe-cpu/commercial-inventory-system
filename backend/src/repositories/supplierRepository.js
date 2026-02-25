const prisma = require('../utils/prisma');

const findAll = () =>
    prisma.supplier.findMany({
        include: {
            _count: { select: { products: true } },
        },
        orderBy: { name: 'asc' },
    });

const findById = (id) =>
    prisma.supplier.findUnique({ where: { id } });

const create = (data) =>
    prisma.supplier.create({ data });

const update = (id, data) =>
    prisma.supplier.update({ where: { id }, data });

const remove = (id) =>
    prisma.supplier.delete({ where: { id } });

module.exports = { findAll, findById, create, update, remove };
