const prisma = require('../utils/prisma');
const repository = require('../repositories/organizationSupplierRepository');
const AppError = require('../utils/AppError');

const normalizeCnpj = value => {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length === 14 ? digits : null;
};
const nullableText = value => value ? String(value).trim() : null;
const getScope = async (establishmentId, db) => {
    const scope = await repository.findEstablishmentScope(establishmentId, db);
    if (!scope) throw new AppError('Estabelecimento não encontrado.', 404);
    if (!scope.organizationId) throw new AppError('Estabelecimento ainda não pertence a uma organização.', 409);
    return scope;
};
const audit = (actionType, entityId, description, establishmentId) => ({
    actionType, entityType: 'ORGANIZATION_SUPPLIER', entityId, description, establishmentId
});
const buildCandidateGroups = suppliers => {
    const groups = new Map();
    for (const supplier of suppliers) {
        const key = normalizeCnpj(supplier.cnpj);
        if (!key) continue;
        groups.set(key, [...(groups.get(key) || []), supplier]);
    }
    return [...groups.entries()]
        .filter(([, items]) => new Set(items.map(item => item.establishmentId || item.establishment.id)).size > 1)
        .map(([candidateKey, items]) => ({ candidateKey, normalizedCnpj: candidateKey, suggestedName: items[0].name, confidence: 'EXACT_CNPJ', suppliers: items }))
        .sort((a, b) => a.suggestedName.localeCompare(b.suggestedName, 'pt-BR'));
};
const list = async establishmentId => {
    const scope = await getScope(establishmentId);
    return repository.findAll(scope.organizationId);
};
const getById = async (id, establishmentId) => {
    const scope = await getScope(establishmentId);
    const item = await repository.findById(id, scope.organizationId);
    if (!item) throw new AppError('Fornecedor central não encontrado.', 404);
    return item;
};
const listReviewCandidates = async establishmentId => {
    const scope = await getScope(establishmentId);
    const [suppliers, reviews] = await Promise.all([repository.findUnlinked(scope.organizationId), repository.findReviews(scope.organizationId)]);
    const reviewByKey = new Map(reviews.map(item => [item.candidateKey, item]));
    const candidates = buildCandidateGroups(suppliers).map(item => ({ ...item, review: reviewByKey.get(item.candidateKey) || null }));
    return { summary: { unlinked: suppliers.length, candidates: candidates.length, pending: candidates.filter(item => !item.review || item.review.status === 'PENDING').length, rejected: candidates.filter(item => item.review?.status === 'REJECTED').length, applied: reviews.filter(item => item.status === 'APPLIED').length }, candidates };
};
const create = (input, establishmentId, userId) => prisma.$transaction(async tx => {
    const scope = await getScope(establishmentId, tx);
    const cnpj = input.cnpj ? normalizeCnpj(input.cnpj) : null;
    if (input.cnpj && !cnpj) throw new AppError('CNPJ deve conter 14 dígitos.', 422);
    const item = await repository.create({ organizationId: scope.organizationId, name: input.name.trim(), legalName: nullableText(input.legalName), cnpj, isActive: input.isActive ?? true }, tx);
    await repository.createAudit(audit('CREATE', item.id, `Fornecedor central "${item.name}" criado por ${userId}.`, establishmentId), tx);
    return item;
});
const update = (id, input, establishmentId, userId) => prisma.$transaction(async tx => {
    const scope = await getScope(establishmentId, tx);
    const existing = await repository.findById(id, scope.organizationId, tx);
    if (!existing) throw new AppError('Fornecedor central não encontrado.', 404);
    const data = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.legalName !== undefined) data.legalName = nullableText(input.legalName);
    if (input.cnpj !== undefined) {
        data.cnpj = input.cnpj ? normalizeCnpj(input.cnpj) : null;
        if (input.cnpj && !data.cnpj) throw new AppError('CNPJ deve conter 14 dígitos.', 422);
    }
    if (input.isActive !== undefined) data.isActive = input.isActive;
    const item = await repository.update(id, data, tx);
    await repository.createAudit(audit('UPDATE', id, `Fornecedor central "${existing.name}" atualizado por ${userId}.`, establishmentId), tx);
    return item;
});
const approveCandidate = (input, establishmentId, userId) => prisma.$transaction(async tx => {
    const scope = await getScope(establishmentId, tx);
    const existingReview = await repository.findReview(scope.organizationId, input.candidateKey, tx);
    if (existingReview?.status === 'APPLIED' && existingReview.appliedOrganizationSupplierId) {
        const existing = await repository.findById(existingReview.appliedOrganizationSupplierId, scope.organizationId, tx);
        if (existing) return { organizationSupplier: existing, review: existingReview, idempotent: true };
    }
    const ids = [...new Set(input.supplierIds)];
    const suppliers = await repository.findForLink(ids, scope.organizationId, tx);
    if (suppliers.length !== ids.length) throw new AppError('Um ou mais fornecedores não pertencem à organização.', 404);
    if (new Set(suppliers.map(item => item.establishmentId)).size !== suppliers.length) throw new AppError('Selecione no máximo um fornecedor por estabelecimento.', 409);
    if (suppliers.some(item => item.organizationSupplierId)) throw new AppError('Um dos fornecedores já possui identidade central.', 409);
    if (suppliers.some(item => normalizeCnpj(item.cnpj) !== input.candidateKey)) throw new AppError('Os fornecedores não pertencem ao mesmo grupo de CNPJ.', 409);
    const central = await repository.create({ organizationId: scope.organizationId, name: input.name.trim(), legalName: nullableText(input.legalName), cnpj: input.candidateKey, isActive: true }, tx);
    await repository.link(ids, central.id, scope.organizationId, tx);
    const review = await repository.upsertReview(scope.organizationId, input.candidateKey, { status: 'APPLIED', supplierIds: ids, suggestedName: input.name.trim(), normalizedCnpj: input.candidateKey, appliedOrganizationSupplierId: central.id, reviewedByUserId: userId, reviewedAt: new Date() }, tx);
    await repository.createAudit(audit('CONSOLIDATE', central.id, `${ids.length} fornecedores consolidados por ${userId}.`, establishmentId), tx);
    return { organizationSupplier: await repository.findById(central.id, scope.organizationId, tx), review, idempotent: false };
});
const rejectCandidate = (input, establishmentId, userId) => prisma.$transaction(async tx => {
    const scope = await getScope(establishmentId, tx);
    const candidates = buildCandidateGroups(await repository.findUnlinked(scope.organizationId, tx));
    const candidate = candidates.find(item => item.candidateKey === input.candidateKey);
    if (!candidate) throw new AppError('Grupo candidato não encontrado ou já alterado.', 404);
    return repository.upsertReview(scope.organizationId, input.candidateKey, { status: 'REJECTED', supplierIds: candidate.suppliers.map(item => item.id), suggestedName: candidate.suggestedName, normalizedCnpj: input.candidateKey, appliedOrganizationSupplierId: null, reviewedByUserId: userId, reviewedAt: new Date() }, tx);
});

module.exports = { normalizeCnpj, buildCandidateGroups, list, getById, listReviewCandidates, create, update, approveCandidate, rejectCandidate };
