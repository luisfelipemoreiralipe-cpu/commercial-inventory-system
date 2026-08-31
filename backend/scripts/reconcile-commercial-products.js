require('dotenv').config();

const prisma = require('../src/utils/prisma');
const apply = process.argv.includes('--apply');
const limitArg = process.argv.find(argument => argument.startsWith('--limit='));
const applyLimit = limitArg ? Number(limitArg.split('=')[1]) : null;
const ORGANIZATION_ID = '41b034b1-fe5a-47bc-910f-c09f49a02149';
const COMMERCIAL_ID = 'e3dd7833-6cf6-4020-b712-4d5c788bff0c';

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const signature = product => [normalize(product.name), normalize(product.unit), normalize(product.purchaseUnit), Number(product.packQuantity || 1)].join('|');
const tokens = value => new Set(normalize(value).split(' ').filter(token => token.length > 1));
const similarity = (left, right) => {
    const a = tokens(left); const b = tokens(right);
    if (!a.size || !b.size) return 0;
    const intersection = [...a].filter(token => b.has(token)).length;
    return intersection / Math.max(a.size, b.size);
};

async function run() {
    const [products, centralProducts, admin] = await Promise.all([
        prisma.product.findMany({
            where: { establishmentId: COMMERCIAL_ID, organizationProductId: null, isActive: true, productSuppliers: { some: { supplier: { organizationSupplierId: { not: null } } } } },
            select: { id: true, name: true, unit: true, purchaseUnit: true, packQuantity: true }
        }),
        prisma.organizationProduct.findMany({
            where: { organizationId: ORGANIZATION_ID, isActive: true },
            include: { localProducts: { select: { id: true, name: true, unit: true, purchaseUnit: true, packQuantity: true, establishmentId: true } } }
        }),
        prisma.userEstablishment.findFirst({ where: { establishmentId: COMMERCIAL_ID, role: 'ADMIN', isActive: true }, select: { userId: true } })
    ]);
    if (!admin) throw new Error('commercial nao possui ADMIN ativo para auditoria.');

    const exactIndex = new Map();
    for (const central of centralProducts) for (const local of central.localProducts) {
        const key = signature(local);
        exactIndex.set(key, [...(exactIndex.get(key) || []), central]);
    }

    const exact = [], create = [], review = [];
    for (const product of products) {
        if (normalize(product.name).length < 3 || normalize(product.name).includes('errado')) {
            review.push({ product, reason: 'INVALID_OR_SUSPECT_NAME', suggestions: [] });
            continue;
        }
        const exactMatches = [...new Map((exactIndex.get(signature(product)) || []).map(item => [item.id, item])).values()]
            .filter(item => !item.localProducts.some(local => local.establishmentId === COMMERCIAL_ID));
        if (exactMatches.length === 1) {
            exact.push({ product, central: exactMatches[0] });
            continue;
        }
        if (exactMatches.length > 1) {
            review.push({ product, reason: 'MULTIPLE_EXACT_MATCHES', suggestions: exactMatches.map(item => ({ id: item.id, name: item.name, score: 1 })) });
            continue;
        }
        const suggestions = centralProducts
            .map(central => ({ central, score: Math.max(similarity(product.name, central.name), ...central.localProducts.map(local => similarity(product.name, local.name))) }))
            .filter(item => item.score >= 0.5)
            .sort((a, b) => b.score - a.score);
        if (suggestions.length) {
            review.push({ product, reason: 'SIMILAR_NAME', suggestions: suggestions.slice(0, 3).map(item => ({ id: item.central.id, name: item.central.name, score: Number(item.score.toFixed(2)) })) });
        } else {
            create.push({ product });
        }
    }

    const createToApply = applyLimit ? create.slice(0, applyLimit) : create;
    if (apply) {
        await prisma.$transaction(async tx => {
            for (const item of exact) {
                await tx.product.update({ where: { id: item.product.id }, data: { organizationProductId: item.central.id } });
                await tx.auditLog.create({ data: { actionType: 'LINK', entityType: 'ORGANIZATION_PRODUCT', entityId: item.central.id, description: `Produto local ${item.product.name} vinculado automaticamente por correspondencia exata.`, establishmentId: COMMERCIAL_ID } });
            }
            for (const item of createToApply) {
                const sequence = await tx.organizationProductSequence.upsert({ where: { organizationId: ORGANIZATION_ID }, create: { organizationId: ORGANIZATION_ID, currentValue: 1 }, update: { currentValue: { increment: 1 } }, select: { currentValue: true } });
                const central = await tx.organizationProduct.create({ data: { organizationId: ORGANIZATION_ID, internalCode: `PROD-${String(sequence.currentValue).padStart(6, '0')}`, name: item.product.name.trim(), baseUnit: String(item.product.unit || 'unidade').trim(), barcode: null, isActive: true } });
                await tx.product.update({ where: { id: item.product.id }, data: { organizationProductId: central.id } });
                await tx.auditLog.create({ data: { actionType: 'CREATE_AND_LINK', entityType: 'ORGANIZATION_PRODUCT', entityId: central.id, description: `Identidade central exclusiva criada para ${item.product.name} por ${admin.userId}.`, establishmentId: COMMERCIAL_ID } });
                item.central = { id: central.id, internalCode: central.internalCode };
            }
        }, { maxWait: 15000, timeout: 120000 });
    }

    console.log(JSON.stringify({ mode: apply ? 'apply' : 'preview', eligible: products.length, exact: exact.length, create: create.length, appliedCreates: apply ? createToApply.length : 0, review: review.length, exactItems: exact.map(item => ({ product: item.product.name, central: item.central.name })), createdItems: createToApply.map(item => ({ product: item.product.name, central: item.central || null })), reviewItems: review.map(item => ({ productId: item.product.id, product: item.product.name, reason: item.reason, suggestions: item.suggestions })) }, null, 2));
}

run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
