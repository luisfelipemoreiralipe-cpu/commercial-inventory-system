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
const update = (id, data) =>
    prisma.supplier.update({
        where: { id },
        data
    });

// REMOVER
const remove = (id) =>
    prisma.supplier.delete({
        where: { id }
    });

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove
};