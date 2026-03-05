const productSupplierRepo = require('../repositories/productSupplierRepository');
const productRepo = require('../repositories/productRepository');
const supplierRepo = require('../repositories/supplierRepository');
const AppError = require('../utils/AppError');

// ─── ADD SUPPLIER TO PRODUCT ─────────────────────────

const addSupplierToProduct = async (productId, supplierId, establishmentId) => {

    const product = await productRepo.findByIdAndEstablishment(productId, establishmentId);

    if (!product) {
        throw new AppError('Produto não encontrado.', 404);
    }

    const supplier = await supplierRepo.findById(supplierId);

    if (!supplier) {
        throw new AppError('Fornecedor inválido.', 400);
    }

    return productSupplierRepo.addSupplierToProduct(productId, supplierId);
};

// ─── GET PRODUCT SUPPLIERS ───────────────────────────

const getProductSuppliers = async (productId, establishmentId) => {

    const product = await productRepo.findByIdAndEstablishment(productId, establishmentId);

    if (!product) {
        throw new AppError('Produto não encontrado.', 404);
    }

    const suppliers = await productSupplierRepo.getSuppliersByProduct(productId);

    return suppliers.map(item => ({
        id: item.supplier.id,
        name: item.supplier.name
    }));
};

// ─── REMOVE SUPPLIER FROM PRODUCT ────────────────────

const removeSupplierFromProduct = async (productId, supplierId, establishmentId) => {

    const product = await productRepo.findByIdAndEstablishment(productId, establishmentId);

    if (!product) {
        throw new AppError('Produto não encontrado.', 404);
    }

    await productSupplierRepo.removeSupplierFromProduct(productId, supplierId);
};

module.exports = {
    addSupplierToProduct,
    getProductSuppliers,
    removeSupplierFromProduct
};