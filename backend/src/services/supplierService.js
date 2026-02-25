const supplierRepo = require('../repositories/supplierRepository');
const auditLogRepo = require('../repositories/auditLogRepository');
const AppError = require('../utils/AppError');

const mkLog = (actionType, entityId, description) => ({
    actionType,
    entityType: 'SUPPLIER',
    entityId,
    description,
});

const getAllSuppliers = () => supplierRepo.findAll();

const getSupplierById = async (id) => {
    const supplier = await supplierRepo.findById(id);
    if (!supplier) throw new AppError('Fornecedor não encontrado.', 404);
    return supplier;
};

const createSupplier = async (data) => {
    const supplier = await supplierRepo.create(data);

    await auditLogRepo.create(
        mkLog('CREATE', supplier.id, `Fornecedor "${supplier.name}" criado.`)
    );

    return supplier;
};

const updateSupplier = async (id, data) => {
    await getSupplierById(id);

    const updated = await supplierRepo.update(id, data);

    await auditLogRepo.create(
        mkLog('UPDATE', id, `Fornecedor "${updated.name}" editado.`)
    );

    return updated;
};

const deleteSupplier = async (id) => {
    const supplier = await getSupplierById(id);

    await supplierRepo.remove(id);

    await auditLogRepo.create(
        mkLog('DELETE', id, `Fornecedor "${supplier.name}" excluído.`)
    );
};

module.exports = {
    getAllSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
};
