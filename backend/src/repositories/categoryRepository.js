const prisma = require('../config/prisma');

const findAll = async () => {
    return prisma.category.findMany({
        orderBy: { name: 'asc' }
    });
};

const findAllByEstablishment = async (establishmentId) => {
    return prisma.category.findMany({
        where: {
            establishmentId
        },
        orderBy: { name: 'asc' }
    });
};

const findById = async (id) => {
    return prisma.category.findUnique({
        where: { id }
    });
};

module.exports = {
    findAll, // 👈 precisa existir
    findById,
    findAllByEstablishment
};