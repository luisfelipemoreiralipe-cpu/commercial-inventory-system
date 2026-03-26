const supplierService = require('../services/supplierService');
const asyncHandler = require('../utils/asyncHandler');

// LISTAR FORNECEDORES
const getAll = asyncHandler(async (req, res) => {

    const establishmentId = req.user.establishmentId;

    const data = await supplierService.getAllSuppliers(establishmentId);

    res.json({
        success: true,
        data
    });
});

// CRIAR FORNECEDOR
const create = asyncHandler(async (req, res) => {

    const establishmentId = req.user.establishmentId;

    const data = await supplierService.createSupplier(
        req.body,
        establishmentId
    );

    res.status(201).json({
        success: true,
        data
    });
});

// ATUALIZAR FORNECEDOR
const update = asyncHandler(async (req, res) => {

    const establishmentId = req.user.establishmentId;

    const data = await supplierService.updateSupplier(
        req.params.id,
        req.body,
        establishmentId
    );

    res.json({
        success: true,
        data
    });
});

// REMOVER FORNECEDOR
const remove = asyncHandler(async (req, res) => {

    const establishmentId = req.user.establishmentId;

    await supplierService.deleteSupplier(
        req.params.id,
        establishmentId
    );

    res.status(204).send();
});

module.exports = {
    getAll,
    create,
    update,
    remove
};