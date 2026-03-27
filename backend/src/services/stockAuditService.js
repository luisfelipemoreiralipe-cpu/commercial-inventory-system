const auditRepo = require('../repositories/stockAuditRepository');
const AppError = require('../utils/AppError');

/*
Criar auditoria
*/
const createAudit = async (userId, establishmentId) => {

    const audit = await auditRepo.createAudit({
        establishmentId,
        createdBy: userId
    });

    const products = await auditRepo.findProductsByEstablishment(
        establishmentId
    );

    const items = products.map(product => ({
        auditId: audit.id,
        productId: product.id,
        systemQuantity: product.quantity,
        countedQuantity: 0,
        difference: 0
    }));

    await auditRepo.createItems(items);

    return audit;
};


/*
Buscar auditoria
*/
const getAuditById = async (auditId, establishmentId) => {

    const audit = await auditRepo.findAuditById(
        auditId,
        establishmentId
    );

    if (!audit) {
        throw new AppError('Auditoria não encontrada', 404);
    }

    const items = audit.items.map(item => ({
        id: item.id,
        productId: item.product.id,
        productName: item.product.name,
        unit: item.product.unit,
        systemQuantity: Number(item.systemQuantity),
        countedQuantity: Number(item.countedQuantity),
        difference: Number(item.difference)
    }));

    return {
        id: audit.id,
        sector: audit.sector.name,
        status: audit.status,
        createdAt: audit.createdAt,
        items
    };
};


/*
Salvar contagem da auditoria
*/
const updateItems = async (auditId, items) => {

    for (const item of items) {

        const auditItem = await auditRepo.findAuditItem(
            auditId,
            item.productId
        );

        if (!auditItem) {
            throw new AppError('Item de auditoria não encontrado', 404);
        }

        const difference =
            item.countedQuantity - Number(auditItem.systemQuantity);

        await auditRepo.updateAuditItem(auditItem.id, {
            countedQuantity: item.countedQuantity,
            difference
        });

    }

};

// const finishAudit = async (auditId, userId) => {

const items = await auditRepo.findAuditItems(auditId);

for (const item of items) {

    if (item.difference !== 0) {

        const newQuantity =
            Number(item.systemQuantity) + Number(item.difference);

        await auditRepo.updateProductStock(
            item.productId,
            newQuantity
        );

        await auditRepo.createStockMovement({
            productId: item.productId,
            productName: item.product.name, // 🔴 linha nova
            type: "ADJUSTMENT",
            quantity: item.difference,
            previousQuantity: Number(item.systemQuantity),
            newQuantity: newQuantity,
            reference: "STOCK_AUDIT",
        });

    }

}

await auditRepo.closeAudit(auditId);

module.exports = {
    createAudit,
    getAuditById,
    updateItems,
    // finishAudit
};