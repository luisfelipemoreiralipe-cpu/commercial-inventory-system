const prisma = require('../utils/prisma');
const repository = require('../repositories/organizationProductRepository');
const AppError = require('../utils/AppError');
const { normalizeBarcode, buildProductCandidateKey } = require('../utils/catalogNormalization');

const formatInternalCode = value => `PROD-${String(value).padStart(6, '0')}`;
const nullableText = value => value ? String(value).trim() : null;

const getScope = async (establishmentId, db) => {
    const establishment = await repository.findEstablishmentScope(establishmentId, db);
    if (!establishment) throw new AppError('Estabelecimento não encontrado.', 404);
    if (!establishment.organizationId) {
        throw new AppError('Estabelecimento ainda não pertence a uma organização.', 409);
    }
    return establishment;
};

const auditData = ({ actionType, entityId, description, establishmentId }) => ({
    actionType,
    entityType: 'ORGANIZATION_PRODUCT',
    entityId,
    description,
    establishmentId
});

const list = async establishmentId => {
    const scope = await getScope(establishmentId);
    return repository.findAll(scope.organizationId);
};

const getById = async (id, establishmentId) => {
    const scope = await getScope(establishmentId);
    const product = await repository.findById(id, scope.organizationId);
    if (!product) throw new AppError('Produto central não encontrado.', 404);
    return product;
};

const listUnlinked = async establishmentId => {
    const scope = await getScope(establishmentId);
    return repository.findUnlinkedProducts(scope.organizationId);
};

const buildCandidateGroups = products => {
    const groups = new Map();
    for (const product of products) {
        const candidateKey = buildProductCandidateKey(product);
        const items = groups.get(candidateKey) || [];
        items.push(product);
        groups.set(candidateKey, items);
    }

    return [...groups.entries()]
        .filter(([, items]) => new Set(items.map(item => item.establishment.id)).size > 1)
        .map(([candidateKey, items]) => ({
            candidateKey,
            suggestedName: items[0].name,
            suggestedBaseUnit: items[0].unit,
            confidence: 'EXACT_NORMALIZED',
            products: items
        }))
        .sort((a, b) => b.products.length - a.products.length
            || a.suggestedName.localeCompare(b.suggestedName, 'pt-BR'));
};

const listReviewCandidates = async establishmentId => {
    const scope = await getScope(establishmentId);
    const [products, reviews] = await Promise.all([
        repository.findUnlinkedProducts(scope.organizationId),
        repository.findProductReviews(scope.organizationId)
    ]);
    const reviewByKey = new Map(reviews.map(review => [review.candidateKey, review]));
    const candidates = buildCandidateGroups(products).map(candidate => ({
        ...candidate,
        review: reviewByKey.get(candidate.candidateKey) || null
    }));

    return {
        summary: {
            unlinkedEligible: products.length,
            candidates: candidates.length,
            pending: candidates.filter(item => !item.review || item.review.status === 'PENDING').length,
            rejected: candidates.filter(item => item.review?.status === 'REJECTED').length,
            applied: reviews.filter(item => item.status === 'APPLIED').length
        },
        candidates,
        appliedReviews: reviews.filter(item => item.status === 'APPLIED')
    };
};

const validateCandidateSelection = (products, candidateKey) => {
    if (products.length < 2) {
        throw new AppError('Selecione pelo menos dois produtos locais.', 422);
    }
    if (products.some(product => product.organizationProductId)) {
        throw new AppError('Um dos produtos selecionados já foi vinculado.', 409);
    }
    if (products.some(product => buildProductCandidateKey(product) !== candidateKey)) {
        throw new AppError('Os produtos selecionados não pertencem ao mesmo grupo normalizado.', 409);
    }
    if (new Set(products.map(product => product.establishmentId)).size !== products.length) {
        throw new AppError('Selecione no máximo um produto por estabelecimento.', 409);
    }
};

const approveReviewCandidate = (input, establishmentId, userId) => prisma.$transaction(async tx => {
    const scope = await getScope(establishmentId, tx);
    const existingReview = await repository.findProductReview(scope.organizationId, input.candidateKey, tx);
    if (existingReview?.status === 'APPLIED' && existingReview.appliedOrganizationProductId) {
        const applied = await repository.findById(
            existingReview.appliedOrganizationProductId,
            scope.organizationId,
            tx
        );
        if (applied) return { organizationProduct: applied, review: existingReview, idempotent: true };
    }

    const uniqueIds = [...new Set(input.productIds)];
    const products = await repository.findProductsForLink(uniqueIds, scope.organizationId, tx);
    if (products.length !== uniqueIds.length) {
        throw new AppError('Um ou mais produtos não pertencem à organização.', 404);
    }
    validateCandidateSelection(products, input.candidateKey);

    const codeNumber = await repository.nextCodeNumber(scope.organizationId, tx);
    const internalCode = formatInternalCode(codeNumber);
    const centralProduct = await repository.create({
        organizationId: scope.organizationId,
        internalCode,
        name: input.name.trim(),
        brand: nullableText(input.brand),
        baseUnit: input.baseUnit.trim(),
        barcode: normalizeBarcode(input.barcode),
        description: nullableText(input.description),
        isActive: true
    }, tx);

    await repository.linkProducts(uniqueIds, centralProduct.id, scope.organizationId, tx);
    const review = await repository.upsertProductReview(scope.organizationId, input.candidateKey, {
        status: 'APPLIED',
        productIds: uniqueIds,
        suggestedName: input.name.trim(),
        appliedOrganizationProductId: centralProduct.id,
        reviewedByUserId: userId,
        reviewedAt: new Date()
    }, tx);
    await repository.createAudit(auditData({
        actionType: 'CONSOLIDATE',
        entityId: centralProduct.id,
        description: `${uniqueIds.length} produtos consolidados em ${internalCode} por ${userId}.`,
        establishmentId
    }), tx);

    return {
        organizationProduct: await repository.findById(centralProduct.id, scope.organizationId, tx),
        review,
        idempotent: false
    };
});

const rejectReviewCandidate = (input, establishmentId, userId) => prisma.$transaction(async tx => {
    const scope = await getScope(establishmentId, tx);
    const unlinked = await repository.findUnlinkedProducts(scope.organizationId, tx);
    const candidate = buildCandidateGroups(unlinked).find(item => item.candidateKey === input.candidateKey);
    if (!candidate) throw new AppError('Grupo candidato não encontrado ou já alterado.', 404);

    const review = await repository.upsertProductReview(scope.organizationId, input.candidateKey, {
        status: 'REJECTED',
        productIds: candidate.products.map(product => product.id),
        suggestedName: candidate.suggestedName,
        appliedOrganizationProductId: null,
        reviewedByUserId: userId,
        reviewedAt: new Date()
    }, tx);
    await repository.createAudit(auditData({
        actionType: 'REJECT_CONSOLIDATION',
        entityId: review.id,
        description: `Sugestão de consolidação rejeitada por ${userId}.`,
        establishmentId
    }), tx);
    return review;
});

const create = (input, establishmentId, userId) => prisma.$transaction(async tx => {
    const scope = await getScope(establishmentId, tx);
    const codeNumber = await repository.nextCodeNumber(scope.organizationId, tx);
    const internalCode = formatInternalCode(codeNumber);
    const product = await repository.create({
        organizationId: scope.organizationId,
        internalCode,
        name: input.name.trim(),
        brand: nullableText(input.brand),
        baseUnit: input.baseUnit.trim(),
        barcode: normalizeBarcode(input.barcode),
        description: nullableText(input.description),
        isActive: input.isActive ?? true
    }, tx);

    await repository.createAudit(auditData({
        actionType: 'CREATE',
        entityId: product.id,
        description: `Produto central ${internalCode} criado por ${userId}.`,
        establishmentId
    }), tx);

    return product;
});

const update = (id, input, establishmentId, userId) => prisma.$transaction(async tx => {
    const scope = await getScope(establishmentId, tx);
    const existing = await repository.findById(id, scope.organizationId, tx);
    if (!existing) throw new AppError('Produto central não encontrado.', 404);

    const data = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.brand !== undefined) data.brand = nullableText(input.brand);
    if (input.baseUnit !== undefined) data.baseUnit = input.baseUnit.trim();
    if (input.barcode !== undefined) data.barcode = normalizeBarcode(input.barcode);
    if (input.description !== undefined) data.description = nullableText(input.description);
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const product = await repository.update(id, data, tx);
    await repository.createAudit(auditData({
        actionType: 'UPDATE',
        entityId: id,
        description: `Produto central ${existing.internalCode} atualizado por ${userId}.`,
        establishmentId
    }), tx);
    return product;
});

const deactivate = (id, establishmentId, userId) => update(
    id,
    { isActive: false },
    establishmentId,
    userId
);

const linkProducts = (id, productIds, establishmentId, userId) => prisma.$transaction(async tx => {
    const scope = await getScope(establishmentId, tx);
    const centralProduct = await repository.findById(id, scope.organizationId, tx);
    if (!centralProduct) throw new AppError('Produto central não encontrado.', 404);

    const uniqueIds = [...new Set(productIds)];
    const products = await repository.findProductsForLink(uniqueIds, scope.organizationId, tx);
    if (products.length !== uniqueIds.length) {
        throw new AppError('Um ou mais produtos locais não pertencem à organização.', 404);
    }

    const existingLinks = await repository.findLocalLinks(id, tx);
    const linkByEstablishment = new Map(existingLinks.map(item => [item.establishmentId, item.id]));
    const requestedByEstablishment = new Map();

    for (const product of products) {
        if (product.organizationProductId && product.organizationProductId !== id) {
            throw new AppError(`O produto "${product.name}" já pertence a outro produto central.`, 409);
        }

        const existingLocalId = linkByEstablishment.get(product.establishmentId);
        if (existingLocalId && existingLocalId !== product.id) {
            throw new AppError('Já existe outro produto local vinculado a este produto central no estabelecimento.', 409);
        }

        const requestedLocalId = requestedByEstablishment.get(product.establishmentId);
        if (requestedLocalId && requestedLocalId !== product.id) {
            throw new AppError('Não é permitido vincular dois produtos do mesmo estabelecimento à mesma identidade central.', 409);
        }
        requestedByEstablishment.set(product.establishmentId, product.id);
    }

    const idsToLink = products
        .filter(product => product.organizationProductId !== id)
        .map(product => product.id);

    if (idsToLink.length) {
        await repository.linkProducts(idsToLink, id, scope.organizationId, tx);
    }

    await repository.createAudit(auditData({
        actionType: 'LINK',
        entityId: id,
        description: `${idsToLink.length} produto(s) local(is) vinculado(s) a ${centralProduct.internalCode} por ${userId}.`,
        establishmentId
    }), tx);

    return repository.findById(id, scope.organizationId, tx);
});

const unlinkProduct = (id, productId, establishmentId, userId) => prisma.$transaction(async tx => {
    const scope = await getScope(establishmentId, tx);
    const centralProduct = await repository.findById(id, scope.organizationId, tx);
    if (!centralProduct) throw new AppError('Produto central não encontrado.', 404);

    const product = await repository.findLinkedProduct(productId, id, scope.organizationId, tx);
    if (!product) throw new AppError('Vínculo não encontrado ou acesso negado.', 404);

    await repository.unlinkProduct(productId, id, scope.organizationId, tx);
    await repository.createAudit(auditData({
        actionType: 'UNLINK',
        entityId: id,
        description: `Produto local "${product.name}" desvinculado de ${centralProduct.internalCode} por ${userId}.`,
        establishmentId
    }), tx);
});

module.exports = {
    formatInternalCode,
    list,
    getById,
    listUnlinked,
    buildCandidateGroups,
    listReviewCandidates,
    approveReviewCandidate,
    rejectReviewCandidate,
    create,
    update,
    deactivate,
    linkProducts,
    unlinkProduct
};
