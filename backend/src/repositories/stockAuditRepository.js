const prisma = require('../config/prisma');

/*
Criar auditoria
*/
const createAudit = (data) => {
    return prisma.stockAudit.create({ data });
};

/*
Criar itens da auditoria
*/
const createItems = (items) => {
    return prisma.stockAuditItem.createMany({
        data: items
    });
};

/*
Buscar produtos por setor
*/
const findProductsBySector = (sectorId, establishmentId) => {
    return prisma.product.findMany({
        where: {
            sectorId,
            establishmentId,
            isActive: true
        },
        select: {
            id: true,
            name: true,
            quantity: true
        }
    });
};

const findProductsByEstablishment = (establishmentId) => {
    return prisma.product.findMany({
        where: {
            establishmentId,
            isActive: true
        },
        select: {
            id: true,
            name: true,
            quantity: true
        }
    });
};
/*
Buscar auditoria com itens
*/
const findAuditById = (id, establishmentId) => {
    return prisma.stockAudit.findFirst({
        where: {
            id,
            establishmentId
        },
        include: {
            sector: true,
            items: {
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            unit: true
                        }
                    }
                }
            }
        }
    });
};

/*
Buscar item específico da auditoria
*/
const findAuditItem = (auditId, productId) => {
    return prisma.stockAuditItem.findFirst({
        where: {
            auditId,
            productId
        }
    });
};

/*
Atualizar item da auditoria
*/
const updateAuditItem = (id, data) => {
    return prisma.stockAuditItem.update({
        where: { id },
        data
    });
};

/*
Buscar itens da auditoria (com produto)
*/
const findAuditItems = (auditId) => {
    return prisma.stockAuditItem.findMany({
        where: { auditId },
        include: {
            product: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
};

/*
Fechar auditoria
*/
const closeAudit = (auditId) => {
    return prisma.stockAudit.update({
        where: { id: auditId },
        data: {
            status: "CLOSED"
        }
    });
};

/*
Atualizar estoque do produto
*/
const updateProductStock = (productId, quantity) => {
    return prisma.product.update({
        where: { id: productId },
        data: {
            quantity
        }
    });
};

/*
Criar movimentação de estoque
*/
const createStockMovement = (data) => {
    return prisma.stockMovement.create({
        data: {
            product: {
                connect: {
                    id: data.productId
                }
            },
            productName: data.productName,
            type: data.type,
            quantity: data.quantity,
            previousQuantity: data.previousQuantity,
            newQuantity: data.newQuantity,
            reference: data.reference,
        }
    });
};

module.exports = {
    createAudit,
    createItems,
    findProductsBySector,
    findAuditById,
    findAuditItem,
    updateAuditItem,
    findAuditItems,
    closeAudit,
    updateProductStock,
    createStockMovement,
    findProductsByEstablishment,
};