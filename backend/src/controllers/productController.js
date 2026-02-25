const productService = require('../services/productService');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
    const data = await productService.getAllProducts();
    res.json({ success: true, data });
});

const getById = asyncHandler(async (req, res) => {
    const data = await productService.getProductById(req.params.id);
    res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
    const data = await productService.createProduct(req.body);
    res.status(201).json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
    const data = await productService.updateProduct(req.params.id, req.body);
    res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
    await productService.deleteProduct(req.params.id);
    res.status(204).send();
});

const updateQuantity = asyncHandler(async (req, res) => {
    const data = await productService.updateProductQuantity(
        req.params.id,
        req.body.quantity
    );
    res.json({ success: true, data });
});

module.exports = { getAll, getById, create, update, remove, updateQuantity };
