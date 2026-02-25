const supplierService = require('../services/supplierService');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
    const data = await supplierService.getAllSuppliers();
    res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
    const data = await supplierService.createSupplier(req.body);
    res.status(201).json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
    const data = await supplierService.updateSupplier(req.params.id, req.body);
    res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
    await supplierService.deleteSupplier(req.params.id);
    res.status(204).send();
});

module.exports = { getAll, create, update, remove };
