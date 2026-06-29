const productRepo = require('../repositories/productRepository');
const categoryRepo = require('../repositories/categoryRepository');
const supplierRepo = require('../repositories/supplierRepository');
const prisma = require('../utils/prisma');
const stockMovementRepo = require('../repositories/stockMovementRepository');
const auditLogRepo = require('../repositories/auditLogRepository');
const AppError = require('../utils/AppError');

// ─── Helpers ───────────────────────────────────────────────────────────

const mkAuditLog = (actionType, entityId, description, establishmentId) => ({
    actionType,
    entityType: 'PRODUCT',
    entityId,
    description,
    establishmentId,
});

const mkMovement = (productId, productName, type, prevQty, newQty, reference, establishmentId) => ({
    productId,
    productName,
    type,
    quantity: Math.abs(newQty - prevQty),
    previousQuantity: prevQty,
    newQuantity: newQty,
    reference,
    establishmentId,
});

// ─── READ ──────────────────────────────────────────────────────────────

const getAllProducts = (establishmentId) =>
    productRepo.findAllByEstablishment(establishmentId);

const getProductById = async (id, establishmentId) => {

    const product = await productRepo.findByIdAndEstablishment(id, establishmentId);

    if (!product) {
        throw new AppError('Produto não encontrado.', 404);
    }

    return product;
};

// ─── CREATE ─────────────────────────────────────────────────────────────

const recipeRepo = require('../repositories/recipeRepository');
const recipeService = require('./recipeService');

const getProductCMV = async (productId, establishmentId) => {
    const recipe = await recipeRepo.findByProductWithItems(productId, establishmentId);
    
    if (!recipe) {
        return {
            productId,
            cost: 0
        };
    }

    const costData = await recipeService.calculateRecipeCost(recipe.id, establishmentId);

    return {
        productId,
        cost: costData.totalCost
    };
};

const createProduct = async (data, establishmentId) => {

    console.log("TYPE NO SERVICE:", data.type); // 🔥 AQUI

    if (!data.categoryId) {
        throw new AppError('Categoria é obrigatória.', 400);
    }

    const category = await categoryRepo.findById(data.categoryId);

    if (!category) {
        throw new AppError('Categoria inválida.', 400);
    }

    const product = await productRepo.create({
        name: data.name,
        unit: data.unit,
        purchaseUnit: data.purchaseUnit || '',
        packQuantity: Number(data.packQuantity || 1),
        categoryId: data.categoryId,
        type: data.type, // 🔥 ESSENCIAL
        unitPrice: data.unitPrice || 0,
        quantity: 0, // Começa sempre com 0, vamos ajustar usando updateProductQuantity para logar correto
        minQuantity: data.minQuantity || 0,
        defaultLocationId: data.defaultLocationId || null,
        establishmentId,
    });

    await auditLogRepo.create(
        mkAuditLog(
            'CREATE',
            product.id,
            `Produto "${product.name}" criado.`,
            establishmentId
        )
    );

    // Se tiver quantidade inicial, registra pelo fluxo correto de estoque
    if (data.quantity && Number(data.quantity) > 0) {
        await updateProductQuantity(product.id, Number(data.quantity), establishmentId, product.defaultLocationId);
    }

    return await getProductById(product.id, establishmentId); // Retorna com as relações e quantidade correta
};

// ─── UPDATE ─────────────────────────────────────────────────────────────

const updateProduct = async (id, data, establishmentId) => {

    const existing = await getProductById(id, establishmentId);

    if (data.categoryId) {
        const category = await categoryRepo.findById(data.categoryId);

        if (!category) {
            throw new AppError('Categoria inválida.', 400);
        }
    }

    if (data.supplierId) {
        const supplier = await supplierRepo.findById(data.supplierId);

        if (!supplier) {
            throw new AppError('Fornecedor inválido.', 400);
        }
    }

    const { quantity, ...updateData } = data; // 🔥 NUNCA atualizamos a quantidade pelo update genérico

    const updated = await productRepo.updateByEstablishment(
        id,
        establishmentId,
        {
            ...updateData,
            defaultLocationId: updateData.defaultLocationId !== undefined ? updateData.defaultLocationId : existing.defaultLocationId
        }
    );

    if (!updated) {
        throw new AppError('Produto não encontrado.', 404);
    }

    await auditLogRepo.create(
        mkAuditLog(
            'UPDATE',
            id,
            `Produto "${existing.name}" editado.`,
            establishmentId
        )
    );

    return updated;
};

// ─── DELETE ─────────────────────────────────────────────────────────────

const deleteProduct = async (id, establishmentId) => {

    const product = await getProductById(id, establishmentId);

    // 1. Verificações de bloqueio absoluto (Ficha Técnica)
    const recipeItem = await prisma.recipeItem.findFirst({
        where: { productId: id, recipe: { establishmentId } }
    });
    if (recipeItem) {
        throw new AppError('Este produto está sendo utilizado como ingrediente em uma ficha técnica e não pode ser excluído.', 400);
    }
    const portioningItem = await prisma.portioningRecipeItem.findFirst({
        where: { targetProductId: id, portioningRecipe: { establishmentId } }
    });
    if (portioningItem) {
        throw new AppError('Este produto é gerado em uma Ficha de Porcionamento e não pode ser excluído.', 400);
    }

    // 2. Verificações de Histórico Financeiro/Estoque (Se tiver, não pode apagar, apenas inativar)
    const hasMovements = await prisma.stockMovement.findFirst({ where: { productId: id, establishmentId } });
    const hasPurchases = await prisma.purchaseOrderItem.findFirst({ where: { productId: id, purchaseOrder: { establishmentId } } });
    const hasAudits = await prisma.stockAuditItem.findFirst({ where: { productId: id, audit: { establishmentId } } });
    const hasProduction = await prisma.productionOrder.findFirst({ where: { productId: id, establishmentId } });

    if (hasMovements || hasPurchases || hasAudits || hasProduction) {
        throw new AppError(
            'Este produto já possui histórico financeiro ou de movimentações (compras, produções, estoques). Para não quebrar seus relatórios, você não pode apagá-lo. Recomendamos que você edite o produto e o marque como Inativo.',
            400
        );
    }

    // 3. Se chegou aqui, o produto é "novo" ou "vazio" e pode ser apagado em segurança.
    // Vamos limpar as tabelas filhas inofensivas antes de apagar a tabela pai para não dar erro de Foreign Key.
    await prisma.$transaction(async (tx) => {
        await tx.supplierPriceHistory.deleteMany({ where: { productId: id } });
        await tx.productSupplier.deleteMany({ where: { productId: id } });
        await tx.productStock.deleteMany({ where: { productId: id } });
        await tx.recipe.deleteMany({ where: { productId: id } });
        await tx.portioningRecipe.deleteMany({ where: { sourceProductId: id } });
        
        await tx.product.delete({ where: { id } });
    });

    await auditLogRepo.create(
        mkAuditLog('DELETE', id, `Produto "${product.name}" excluído definitivamente.`, establishmentId)
    );
};
// ─── UPDATE STOCK ──────────────────────────────────────────────────────

const updateProductQuantity = async (id, newQuantity, establishmentId, locationId) => {

    const product = await getProductById(id, establishmentId);
    
    let targetLocationId = locationId || product.defaultLocationId;
    if (!targetLocationId) {
        const defaultLoc = await prisma.stockLocation.findFirst({ where: { establishmentId, isDefault: true }});
        targetLocationId = defaultLoc ? defaultLoc.id : null;
    }

    if (!targetLocationId) throw new AppError("Local de estoque não definido para este produto.", 400);

    const stockRecord = await prisma.productStock.upsert({
        where: { productId_locationId: { productId: product.id, locationId: targetLocationId } },
        create: { productId: product.id, locationId: targetLocationId, quantity: 0 },
        update: {}
    });

    const prevQty = Number(stockRecord.quantity);
    const difference = newQuantity - prevQty;

    // Atualiza o local
    await prisma.productStock.update({
        where: { id: stockRecord.id },
        data: { quantity: newQuantity }
    });

    // Atualiza o total global cacheado
    const updated = await productRepo.updateByEstablishment(
        id,
        establishmentId,
        { quantity: Number(product.quantity) + difference }
    );

    if (!updated) {
        throw new AppError('Produto não encontrado.', 404);
    }

    await stockMovementRepo.create(
        mkMovement(
            id,
            product.name,
            'adjustment',
            prevQty,
            newQuantity,
            'Ajuste Manual',
            establishmentId
        )
    );

    // Ajusta o locationId do movement recém criado
    await prisma.stockMovement.updateMany({
        where: { productId: id, reference: 'Ajuste Manual', createdAt: { gte: new Date(Date.now() - 10000) } },
        data: { locationId: targetLocationId }
    });

    await auditLogRepo.create(
        mkAuditLog(
            'UPDATE',
            id,
            `Estoque de "${product.name}" ajustado manualmente: ${prevQty} → ${newQuantity} ${product.unit}.`,
            establishmentId
        )
    );

    return updated;
};

// ─── PRICE HISTORY ─────────────────────────────────────────────────────

const getPriceHistory = async (productId, establishmentId) => {

    await getProductById(productId, establishmentId);

    const history = await productRepo.getPriceHistory(productId, establishmentId);

    return history.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        adjustedQuantity: Number(item.adjustedQuantity),
        supplierName: item.supplier?.name || null
    }));
};

// ─── BEST SUPPLIER ─────────────────────────────────────────────────────

const getBestSupplier = async (productId, establishmentId) => {

    const history = await getPriceHistory(productId, establishmentId);

    if (!history.length) {
        throw new AppError('Nenhum histórico de preço encontrado para este produto.', 404);
    }

    const lastPurchase = history[0];

    let best = history[0];

    history.forEach(item => {
        if (item.unitPrice < best.unitPrice) {
            best = item;
        }
    });

    return {
        productId,
        bestSupplier: best.supplierName,
        bestPrice: best.unitPrice,
        lastPrice: lastPurchase.unitPrice,
        saving: lastPurchase.unitPrice - best.unitPrice
    };
};

// ─── SUPPLIER COMPARISON ───────────────────────────────────────────────

const getSupplierComparison = async (productId, establishmentId) => {

    const history = await getPriceHistory(productId, establishmentId);

    if (!history.length) {
        throw new AppError('Nenhum histórico de preço encontrado para este produto.', 404);
    }

    const suppliersMap = {};

    history.forEach(item => {

        const supplierName = item.supplierName;

        if (!suppliersMap[supplierName]) {
            suppliersMap[supplierName] = item.unitPrice;
        } else {
            suppliersMap[supplierName] = Math.min(
                suppliersMap[supplierName],
                item.unitPrice
            );
        }

    });

    const suppliers = Object.entries(suppliersMap).map(([supplier, price]) => ({
        supplier,
        bestPrice: price
    }));

    suppliers.sort((a, b) => a.bestPrice - b.bestPrice);

    return {
        productId,
        suppliers
    };
};

// ─── PURCHASE SAVINGS REPORT ───────────────────────────────────────────

const getPurchaseSavings = async (establishmentId) => {

    const products = await productRepo.findAllByEstablishment(establishmentId);

    const report = [];

    for (const product of products) {

        const history = await getPriceHistory(product.id, establishmentId);

        if (!history.length) continue;

        const lastPurchase = history[0];

        let bestPrice = history[0].unitPrice;

        history.forEach(item => {
            if (item.unitPrice < bestPrice) {
                bestPrice = item.unitPrice;
            }
        });

        const savingPerUnit = lastPurchase.unitPrice - bestPrice;

        const quantityBought = lastPurchase.adjustedQuantity;

        const saving = savingPerUnit * quantityBought;

        if (saving > 0) {
            report.push({
                product: product.name,
                currentPrice: lastPurchase.unitPrice,
                bestPrice,
                quantityBought,
                savingPerUnit,
                saving
            });
        }

    }

    const totalSaving = report.reduce((sum, item) => sum + item.saving, 0);

    return {
        products: report,
        totalSaving
    };

};

// ─── PRODUCT SUPPLIERS ─────────────────────────────────────────────────



module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateProductQuantity,
    getPriceHistory,
    getBestSupplier,
    getSupplierComparison,
    getPurchaseSavings,
    getProductCMV
};