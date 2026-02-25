const prisma = require('../utils/prisma');

const findAll = () =>
    prisma.category.findMany({
        orderBy: { name: 'asc' },
    });

const findById = (id) =>
    prisma.category.findUnique({ where: { id } });

const findByName = (name) =>
    prisma.category.findUnique({ where: { name } });

const create = (data) =>
    prisma.category.create({ data });

const update = (id, data) =>
    prisma.category.update({ where: { id }, data });

const remove = (id) =>
    prisma.category.delete({ where: { id } });

module.exports = { findAll, findById, findByName, create, update, remove };
