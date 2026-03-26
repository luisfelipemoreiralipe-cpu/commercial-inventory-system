const supplierRepo = require('../repositories/supplierRepository');
const auditLogRepo = require('../repositories/auditLogRepository');
const AppError = require('../utils/AppError');

const mkLog = (actionType, entityId, description, establishmentId) => ({
    actionType,
    entityType: 'SUPPLIER',
    entityId,
    description,
    establishmentId
});


// LISTAR FORNECEDORES
const getAllSuppliers = (establishmentId) =>
    supplierRepo.findAll(establishmentId);


// BUSCAR POR ID
const getSupplierById = async (id, establishmentId) => {

    const supplier = await supplierRepo.findById(id, establishmentId);

    if (!supplier) {
        throw new AppError('Fornecedor não encontrado.', 404);
    }

    return supplier;
};


// CRIAR FORNECEDOR
const createSupplier = async (data, establishmentId) => {

    if (!data.name) {
        throw new AppError('Nome do fornecedor é obrigatório.', 400);
    }

    const supplier = await supplierRepo.create({
        name: data.name,
        cnpj: data.cnpj || null,
        phone: data.phone || null,
        email: data.email || null,
        establishmentId
    });

    await auditLogRepo.create(
        mkLog(
            'CREATE',
            supplier.id,
            `Fornecedor "${supplier.name}" criado.`,
            establishmentId
        )
    );

    return supplier;
};


// ATUALIZAR
const updateSupplier = async (id, data, establishmentId) => {

    await getSupplierById(id, establishmentId);

    const updated = await supplierRepo.update(id, {
        name: data.name,
        cnpj: data.cnpj,
        phone: data.phone,
        email: data.email
    });

    await auditLogRepo.create(
        mkLog(
            'UPDATE',
            id,
            `Fornecedor "${updated.name}" editado.`,
            establishmentId
        )
    );

    return updated;
};


// EXCLUIR
const deleteSupplier = async (id, establishmentId) => {

    const supplier = await getSupplierById(id, establishmentId);

    await supplierRepo.remove(id, establishmentId);

    await auditLogRepo.create(
        mkLog(
            'DELETE',
            id,
            `Fornecedor "${supplier.name}" excluído.`,
            establishmentId
        )
    );
};


module.exports = {
    getAllSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier
};