const prisma = require('../config/prisma');

const create = (data) => {
    return prisma.stockTransfer.create({
        data
    });
};

module.exports = {
    create
};