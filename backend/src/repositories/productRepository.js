const prisma = require('../config/prisma');

const findAllByEstablishment = (establishmentId) => {
    return prisma.product.findMany({
        where: { establishmentId },
        include: {
            category: true,
            Recipe: true,
            productSuppliers: {
                include: {
                    supplier: true
                }
            }
        }
    });
};

const findByIdAndEstablishment = (id, establishmentId) => {
    return prisma.product.findFirst({
        where: {
            id,
            establishmentId
        },
        include: {
            category: true,
            productSuppliers: {
                include: {
                    supplier: true
                }
            }
        }
    });
};

const create = (data) => {
    return prisma.product.create({
        data
    });
};

const updateByEstablishment = (id, establishmentId, data) => {
    return prisma.product.updateMany({
        where: {
            id,
            establishmentId
        },
        data
    });
};

const removeByEstablishment = async (id, establishmentId) => {

    const product = await prisma.product.findFirst({
        where: {
            id,
            establishmentId
        }
    });

    if (!product) {
        throw new Error("Produto não encontrado");
    }

    return prisma.product.delete({
        where: {
            id: product.id
        }
    });

};

const getPriceHistory = (productId) => {
    return prisma.supplierPriceHistory.findMany({
        where: { productId },
        include: {
            supplier: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

const getLastPurchasePrice = async (productId) => {

    const history = await prisma.supplierPriceHistory.findFirst({
        where: { productId },
        orderBy: { createdAt: 'desc' }
    });

    if (history) {
        return Number(history.price);
    }

    const supplier = await prisma.productSupplier.findFirst({
        where: { productId },
        orderBy: { price: 'asc' }
    });

    if (supplier) {
        return Number(supplier.price);
    }

    return 0;
};



module.exports = {
    findAllByEstablishment,
    findByIdAndEstablishment,
    create,
    updateByEstablishment,
    removeByEstablishment,
    getPriceHistory,
    getLastPurchasePrice
};