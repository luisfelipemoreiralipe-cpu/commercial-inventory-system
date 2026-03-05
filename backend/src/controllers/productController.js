const productService = require('../services/productService');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
    const data = await productService.getAllProducts(req.user.establishmentId);
    res.json({ success: true, data });
});

const getById = asyncHandler(async (req, res) => {
    const data = await productService.getProductById(
        req.params.id,
        req.user.establishmentId
    );
    res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
    const data = await productService.createProduct(
        req.body,
        req.user.establishmentId
    );
    res.status(201).json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
    const data = await productService.updateProduct(
        req.params.id,
        req.body,
        req.user.establishmentId
    );
    res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
    await productService.deleteProduct(
        req.params.id,
        req.user.establishmentId
    );
    res.status(204).send();
});

const updateQuantity = asyncHandler(async (req, res) => {
    const data = await productService.updateProductQuantity(
        req.params.id,
        req.body.quantity,
        req.user.establishmentId
    );
    res.json({ success: true, data });
});

// ─── PRICE HISTORY ─────────────────────────────────────────────────────

const getPriceHistory = asyncHandler(async (req, res) => {
    const data = await productService.getPriceHistory(
        req.params.id,
        req.user.establishmentId
    );

    res.json({ success: true, data });
});

// ─── BEST SUPPLIER ─────────────────────────────────────────────────────

const getBestSupplier = asyncHandler(async (req, res) => {
    const data = await productService.getBestSupplier(
        req.params.id,
        req.user.establishmentId
    );

    res.json({ success: true, data });
});

// ─── SUPPLIER COMPARISON ───────────────────────────────────────────────

const getSupplierComparison = asyncHandler(async (req, res) => {

    const data = await productService.getSupplierComparison(
        req.params.id,
        req.user.establishmentId
    );

    res.json({ success: true, data });

});

// ─── PRODUCT SUPPLIERS ─────────────────────────────────────────────────

const addSupplier = asyncHandler(async (req, res) => {

    const data = await productService.addSupplierToProduct(
        req.params.id,
        req.body.supplierId,
        req.user.establishmentId
    );

    res.status(201).json({ success: true, data });

});

const getSuppliers = asyncHandler(async (req, res) => {

    const data = await productService.getProductSuppliers(
        req.params.id,
        req.user.establishmentId
    );

    res.json({ success: true, data });

});

const removeSupplier = asyncHandler(async (req, res) => {

    await productService.removeSupplierFromProduct(
        req.params.productId,
        req.params.supplierId,
        req.user.establishmentId
    );

    res.status(204).send();

});

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    updateQuantity,
    getPriceHistory,
    getBestSupplier,
    getSupplierComparison,

    addSupplier,
    getSuppliers,
    removeSupplier
};