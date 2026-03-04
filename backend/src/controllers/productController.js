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

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    updateQuantity,
    getPriceHistory
};