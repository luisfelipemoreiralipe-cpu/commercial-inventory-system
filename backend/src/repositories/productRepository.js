const prisma = require('../utils/prisma');

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
    // establishmentId deve vir em data (validado no service)
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
        throw new Error("Produto não encontrado ou acesso negado.");
    }

    return prisma.product.delete({
        where: {
            id: product.id
        }
    });

};

/**
 * 🔐 HISTÓRICO DE PREÇOS
 * Filtragem por establishmentId via relação Product.
 */
const getPriceHistory = (productId, establishmentId) => {
    return prisma.supplierPriceHistory.findMany({
        where: { 
            productId,
            product: {
                establishmentId
            }
        },
        include: {
            supplier: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

/**
 * 🔐 ÚLTIMO PREÇO DE COMPRA
 */
const getLastPurchasePrice = async (productId, establishmentId) => {

    const history = await prisma.supplierPriceHistory.findFirst({
        where: { 
            productId,
            product: {
                establishmentId
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (history) {
        return Number(history.price);
    }

    // Tenta pegar o preço do fornecedor padrão se não houver histórico
    const supplier = await prisma.productSupplier.findFirst({
        where: { 
            productId,
            product: {
                establishmentId
            }
        },
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