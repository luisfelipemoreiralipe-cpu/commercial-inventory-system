const prisma = require('../utils/prisma');

const findAll = () =>
    prisma.product.findMany({
        include: { supplier: { select: { id: true, name: true } }, category: true },
        orderBy: { name: 'asc' },
    });

const findById = (id) =>
    prisma.product.findUnique({
        where: { id },
        include: { supplier: { select: { id: true, name: true } }, category: true },
    });

const create = (data) =>
    prisma.product.create({
        data,
        include: { supplier: { select: { id: true, name: true } }, category: true },
    });

const update = (id, data) =>
    prisma.product.update({
        where: { id },
        data,
        include: { supplier: { select: { id: true, name: true } }, category: true },
    });

const remove = (id) =>
    prisma.product.delete({ where: { id } });

module.exports = { findAll, findById, create, update, remove };
