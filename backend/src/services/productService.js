const productRepo = require('../repositories/productRepository');
const categoryRepo = require('../repositories/categoryRepository');
const supplierRepo = require('../repositories/supplierRepository');
const stockMovementRepo = require('../repositories/stockMovementRepository');
const auditLogRepo = require('../repositories/auditLogRepository');
const AppError = require('../utils/AppError');

// ─── Internal helpers ─────────────────────────────────────────────────────────
const mkAuditLog = (actionType, entityId, description, establishmentId) => ({
    actionType,
    entityType: 'PRODUCT',
    entityId,
    description,
    establishmentId,
});

const mkMovement = (productId, productName, type, prevQty, newQty, reference, establishmentId) => ({
    productId,
    productName,
    type,
    quantity: Math.abs(newQty - prevQty),
    previousQuantity: prevQty,
    newQuantity: newQty,
    reference,
    establishmentId,
});

// ─── Service ──────────────────────────────────────────────────────────────────

const getAllProducts = (establishmentId) =>
    productRepo.findAllByEstablishment(establishmentId);

const getProductById = async (id, establishmentId) => {
    const product = await productRepo.findByIdAndEstablishment(id, establishmentId);

    if (!product) {
        throw new AppError('Produto não encontrado.', 404);
    }

    return product;
};

const createProduct = async (data, establishmentId) => {
    console.log("ESTABLISHMENT ID RECEBIDO:", establishmentId)

    // ─── validar categoria ─────────────────────────────────

    if (!data.categoryId) {
        throw new AppError('Categoria é obrigatória.', 400);
    }

    const category = await categoryRepo.findById(data.categoryId);

    if (!category) {
        throw new AppError('Categoria inválida.', 400);
    }

    // ─── validar fornecedor ─────────────────────────────────

    if (!data.supplierId) {
        throw new AppError('Fornecedor é obrigatório.', 400);
    }

    const supplier = await supplierRepo.findById(data.supplierId);

    if (!supplier) {
        throw new AppError('Fornecedor inválido.', 400);
    }

    // ─── criar produto ─────────────────────────────────

    const product = await productRepo.create({
        ...data,
        establishmentId,
    });

    await auditLogRepo.create(
        mkAuditLog(
            'CREATE',
            product.id,
            `Produto "${product.name}" criado.`,
            establishmentId
        )
    );

    return product;
};

const updateProduct = async (id, data, establishmentId) => {

    const existing = await getProductById(id, establishmentId);

    if (data.categoryId) {
        const category = await categoryRepo.findById(data.categoryId);

        if (!category) {
            throw new AppError('Categoria inválida.', 400);
        }
    }

    if (data.supplierId) {
        const supplier = await supplierRepo.findById(data.supplierId);

        if (!supplier) {
            throw new AppError('Fornecedor inválido.', 400);
        }
    }

    const updated = await productRepo.updateByEstablishment(
        id,
        establishmentId,
        data
    );

    if (!updated) {
        throw new AppError('Produto não encontrado.', 404);
    }

    await auditLogRepo.create(
        mkAuditLog(
            'UPDATE',
            id,
            `Produto "${existing.name}" editado.`,
            establishmentId
        )
    );

    return updated;
};

const deleteProduct = async (id, establishmentId) => {

    const product = await getProductById(id, establishmentId);

    await productRepo.removeByEstablishment(id, establishmentId);

    await auditLogRepo.create(
        mkAuditLog(
            'DELETE',
            id,
            `Produto "${product.name}" excluído.`,
            establishmentId
        )
    );
};

const updateProductQuantity = async (id, newQuantity, establishmentId) => {

    const product = await getProductById(id, establishmentId);
    const prevQty = product.quantity;

    const updated = await productRepo.updateByEstablishment(
        id,
        establishmentId,
        { quantity: newQuantity }
    );

    if (!updated) {
        throw new AppError('Produto não encontrado.', 404);
    }

    await stockMovementRepo.create(
        mkMovement(
            id,
            product.name,
            'adjustment',
            prevQty,
            newQuantity,
            'Ajuste Manual',
            establishmentId
        )
    );

    await auditLogRepo.create(
        mkAuditLog(
            'UPDATE',
            id,
            `Estoque de "${product.name}" ajustado manualmente: ${prevQty} → ${newQuantity} ${product.unit}.`,
            establishmentId
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