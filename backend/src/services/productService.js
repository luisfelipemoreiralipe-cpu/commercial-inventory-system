const productRepo = require('../repositories/productRepository');
const categoryRepo = require('../repositories/categoryRepository');
const supplierRepo = require('../repositories/supplierRepository');
const stockMovementRepo = require('../repositories/stockMovementRepository');
const auditLogRepo = require('../repositories/auditLogRepository');
const AppError = require('../utils/AppError');

// ─── Helpers ───────────────────────────────────────────────────────────

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

// ─── READ ──────────────────────────────────────────────────────────────

const getAllProducts = (establishmentId) =>
    productRepo.findAllByEstablishment(establishmentId);

const getProductById = async (id, establishmentId) => {

    const product = await productRepo.findByIdAndEstablishment(id, establishmentId);

    if (!product) {
        throw new AppError('Produto não encontrado.', 404);
    }

    return product;
};

// ─── CREATE ─────────────────────────────────────────────────────────────

const createProduct = async (data, establishmentId) => {

    if (!data.categoryId) {
        throw new AppError('Categoria é obrigatória.', 400);
    }

    const category = await categoryRepo.findById(data.categoryId);

    if (!category) {
        throw new AppError('Categoria inválida.', 400);
    }

    if (!data.supplierId) {
        throw new AppError('Fornecedor é obrigatório.', 400);
    }

    const supplier = await supplierRepo.findById(data.supplierId);

    if (!supplier) {
        throw new AppError('Fornecedor inválido.', 400);
    }

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

// ─── UPDATE ─────────────────────────────────────────────────────────────

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

// ─── DELETE ─────────────────────────────────────────────────────────────

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

// ─── UPDATE STOCK ──────────────────────────────────────────────────────

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

// ─── PRICE HISTORY ─────────────────────────────────────────────────────

const getPriceHistory = async (productId, establishmentId) => {

    await getProductById(productId, establishmentId);

    const history = await productRepo.getPriceHistory(productId);

    return history.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        adjustedQuantity: Number(item.adjustedQuantity),
        supplierName: item.supplier?.name || null
    }));
};

// ─── BEST SUPPLIER ─────────────────────────────────────────────────────

const getBestSupplier = async (productId, establishmentId) => {

    const history = await getPriceHistory(productId, establishmentId);

    if (!history.length) {
        throw new AppError('Nenhum histórico de preço encontrado para este produto.', 404);
    }

    const lastPurchase = history[0];

    let best = history[0];

    history.forEach(item => {
        if (item.unitPrice < best.unitPrice) {
            best = item;
        }
    });

    return {
        productId,
        bestSupplier: best.supplierName,
        bestPrice: best.unitPrice,
        lastPrice: lastPurchase.unitPrice,
        saving: lastPurchase.unitPrice - best.unitPrice
    };
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductQuantity,
    getPriceHistory,
    getBestSupplier
};