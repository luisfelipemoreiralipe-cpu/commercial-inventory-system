const prisma = require('../config/prisma');

const findAll = async () => {
    return prisma.category.findMany({
        orderBy: { name: 'asc' }
    });
};

const findById = async (id) => {
    return prisma.category.findUnique({
        where: { id }
    });
};

module.exports = {
    findAll,
    findById
};