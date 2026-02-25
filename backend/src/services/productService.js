const productRepo = require('../repositories/productRepository');
const categoryRepo = require('../repositories/categoryRepository');
const stockMovementRepo = require('../repositories/stockMovementRepository');
const auditLogRepo = require('../repositories/auditLogRepository');
const AppError = require('../utils/AppError');

// ─── Internal helpers ─────────────────────────────────────────────────────────
const mkAuditLog = (actionType, entityId, description) => ({
    actionType,
    entityType: 'PRODUCT',
    entityId,
    description,
});

const mkMovement = (productId, productName, type, prevQty, newQty, reference) => ({
    productId,
    productName,
    type,
    quantity: Math.abs(newQty - prevQty),
    previousQuantity: prevQty,
    newQuantity: newQty,
    reference,
});

// ─── Service ──────────────────────────────────────────────────────────────────
const getAllProducts = () => productRepo.findAll();

const getProductById = async (id) => {
    const product = await productRepo.findById(id);
    if (!product) throw new AppError('Produto não encontrado.', 404);
    return product;
};

const createProduct = async (data) => {
    if (data.categoryId) {
        const category = await categoryRepo.findById(data.categoryId);
        if (!category) throw new AppError('Categoria não encontrada.', 404);
    }
    const product = await productRepo.create(data);

    await auditLogRepo.create(
        mkAuditLog('CREATE', product.id, `Produto "${product.name}" criado.`)
    );

    return product;
};

const updateProduct = async (id, data) => {
    await getProductById(id); // ensures 404 if not found

    if (data.categoryId) {
        const category = await categoryRepo.findById(data.categoryId);
        if (!category) throw new AppError('Categoria não encontrada.', 404);
    }

    const updated = await productRepo.update(id, data);

    await auditLogRepo.create(
        mkAuditLog('UPDATE', id, `Produto "${updated.name}" editado.`)
    );

    return updated;
};

const deleteProduct = async (id) => {
    const product = await getProductById(id);

    await productRepo.remove(id);

    await auditLogRepo.create(
        mkAuditLog('DELETE', id, `Produto "${product.name}" excluído.`)
    );
};

/**
 * Manual quantity adjustment.
 * Creates a Stock Movement + Audit Log as side effects.
 */
const updateProductQuantity = async (id, newQuantity) => {
    const product = await getProductById(id);
    const prevQty = product.quantity;

    const updated = await productRepo.update(id, { quantity: newQuantity });

    await stockMovementRepo.create(
        mkMovement(id, product.name, 'adjustment', prevQty, newQuantity, 'Ajuste Manual')
    );

    await auditLogRepo.create(
        mkAuditLog(
            'UPDATE',
            id,
            `Estoque de "${product.name}" ajustado manualmente: ${prevQty} → ${newQuantity} ${product.unit}.`
        )
    );

    return updated;
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductQuantity,
};
