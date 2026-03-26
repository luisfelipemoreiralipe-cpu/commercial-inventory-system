const prisma = require('../utils/prisma');

// LISTAR
const findAll = (establishmentId) =>
    prisma.supplier.findMany({
        where: { establishmentId },
        orderBy: { name: 'asc' },
    });

// BUSCAR POR ID
const findById = (id, establishmentId) =>
    prisma.supplier.findFirst({
        where: {
            id,
            establishmentId
        }
    });

// CRIAR
const create = (data) =>
    prisma.supplier.create({
        data
    });

// ATUALIZAR
const update = (id, data, establishmentId) =>
    prisma.supplier.updateMany({
        where: {
            id,
            establishmentId
        },
        data
    });

// REMOVER
const remove = (id, establishmentId) =>
    prisma.supplier.deleteMany({
        where: {
            id,
            establishmentId
        }
    });

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};