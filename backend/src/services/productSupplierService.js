const productSupplierRepo = require('../repositories/productSupplierRepository');
const productRepo = require('../repositories/productRepository');
const supplierRepo = require('../repositories/supplierRepository');
const AppError = require('../utils/AppError');
const prisma = require('../utils/prisma');


// ─── ADD SUPPLIER TO PRODUCT ─────────────────────────

const addSupplierToProduct = async (productId, supplierId, price, establishmentId, syncNetwork) => {

    const product = await productRepo.findByIdAndEstablishment(productId, establishmentId);

    if (!product) {
        throw new AppError('Produto não encontrado.', 404);
    }

    const supplier = await supplierRepo.findById(supplierId);

    if (!supplier) {
        throw new AppError('Fornecedor inválido.', 400);
    }

    if (!price || Number(price) <= 0) {
        throw new AppError('Preço inválido.', 400);
    }

    const result = await productSupplierRepo.upsertSupplierToProduct(
        productId,
        supplierId,
        Number(price)
    );

    // Lógica de replicação de preço na rede
    if (syncNetwork) {
        try {
            const currentEst = await prisma.establishments.findUnique({ where: { id: establishmentId } });
            if (currentEst && currentEst.organizationId) {
                // Buscar outras lojas da mesma organização
                const siblingEsts = await prisma.establishments.findMany({
                    where: {
                        organizationId: currentEst.organizationId,
                        id: { not: establishmentId }
                    }
                });

                for (const sibling of siblingEsts) {
                    // Tentar achar o mesmo produto no estabelecimento irmão (pelo nome)
                    const siblingProduct = await prisma.product.findFirst({
                        where: {
                            establishmentId: sibling.id,
                            name: product.name,
                            isActive: true
                        }
                    });

                    // Tentar achar o mesmo fornecedor (pelo nome ou CNPJ)
                    const siblingSupplier = await prisma.supplier.findFirst({
                        where: {
                            establishmentId: sibling.id,
                            OR: [
                                { name: supplier.name },
                                ...(supplier.cnpj ? [{ cnpj: supplier.cnpj }] : [])
                            ]
                        }
                    });

                     if (siblingProduct && siblingSupplier) {
                        await productSupplierRepo.upsertSupplierToProduct(
                            siblingProduct.id,
                            siblingSupplier.id,
                            Number(price)
                        );
                    }
                }
            }
        } catch (error) {
            console.error("Erro ao sincronizar preço na rede:", error);
            // Falhas na sincronização não devem impedir o retorno do sucesso para o principal
        }
    }

    return result;
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
        name: item.supplier.name,
        price: Number(item.price)
    }));

};


// ─── REMOVE SUPPLIER FROM PRODUCT ────────────────────

const removeSupplierFromProduct = async (productId, supplierId, establishmentId) => {

    const product = await productRepo.findByIdAndEstablishment(productId, establishmentId);

    if (!product) {
        throw new AppError('Produto não encontrado.', 404);
    }

    await productSupplierRepo.removeSupplierFromProduct(
        productId,
        supplierId
    );

};


module.exports = {
    addSupplierToProduct,
    getProductSuppliers,
    removeSupplierFromProduct
};