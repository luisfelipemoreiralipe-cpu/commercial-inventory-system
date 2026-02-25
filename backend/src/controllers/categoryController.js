const categoryService = require('../services/categoryService');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
    const data = await categoryService.getAllCategories();
    res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
    const data = await categoryService.createCategory(req.body);
    res.status(201).json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
    const data = await categoryService.updateCategory(req.params.id, req.body);
    res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
    await categoryService.deleteCategory(req.params.id);
    res.status(204).send();
});

module.exports = { getAll, create, update, remove };
