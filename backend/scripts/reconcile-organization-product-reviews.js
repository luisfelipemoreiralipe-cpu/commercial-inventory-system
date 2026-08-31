const prisma = require('../src/utils/prisma');

const establishmentId = process.argv[2];
const rollbackIndex = process.argv.indexOf('--rollback');
const reviewId = rollbackIndex >= 0 ? process.argv[rollbackIndex + 1] : null;
const apply = process.argv.includes('--apply');

if (!establishmentId) {
    console.error('Uso: node scripts/reconcile-organization-product-reviews.js <establishmentId> [--rollback <reviewId> --apply]');
    process.exitCode = 1;
} else {
    run().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    }).finally(() => prisma.$disconnect());
}

async function getScope() {
    const establishment = await prisma.establishments.findUnique({
        where: { id: establishmentId },
        select: { id: true, name: true, organizationId: true }
    });
    if (!establishment?.organizationId) throw new Error('Estabelecimento ou organização não encontrado.');
    return establishment;
}

async function summarize(scope) {
    const [reviews, centralProducts, unlinkedEligible] = await Promise.all([
        prisma.organizationProductReview.findMany({ where: { organizationId: scope.organizationId } }),
        prisma.organizationProduct.findMany({
            where: { organizationId: scope.organizationId },
            select: { id: true, internalCode: true, isActive: true, _count: { select: { localProducts: true } } }
        }),
        prisma.product.count({
            where: {
                establishment: { organizationId: scope.organizationId },
                organizationProductId: null,
                isActive: true,
                type: 'INVENTORY',
                purchaseClassification: { not: 'EXCLUDED' }
            }
        })
    ]);
    const centralIds = new Set(centralProducts.map(product => product.id));
    return {
        generatedAt: new Date().toISOString(),
        readOnly: true,
        organizationId: scope.organizationId,
        totals: {
            reviews: reviews.length,
            applied: reviews.filter(review => review.status === 'APPLIED').length,
            rejected: reviews.filter(review => review.status === 'REJECTED').length,
            rolledBack: reviews.filter(review => review.status === 'ROLLED_BACK').length,
            centralProducts: centralProducts.length,
            localLinks: centralProducts.reduce((sum, product) => sum + product._count.localProducts, 0),
            unlinkedEligible
        },
        conflicts: reviews
            .filter(review => review.status === 'APPLIED'
                && (!review.appliedOrganizationProductId || !centralIds.has(review.appliedOrganizationProductId)))
            .map(review => ({ reviewId: review.id, candidateKey: review.candidateKey, reason: 'CENTRAL_PRODUCT_NOT_FOUND' }))
    };
}

async function rollback(scope) {
    const review = await prisma.organizationProductReview.findFirst({
        where: { id: reviewId, organizationId: scope.organizationId }
    });
    if (!review) throw new Error('Revisão não encontrada na organização informada.');
    if (review.status === 'ROLLED_BACK') return { idempotent: true, reviewId, status: review.status };
    if (review.status !== 'APPLIED' || !review.appliedOrganizationProductId) {
        throw new Error('Somente uma revisão aplicada pode ser revertida.');
    }

    const productIds = Array.isArray(review.productIds) ? review.productIds : [];
    const preview = {
        reviewId,
        organizationProductId: review.appliedOrganizationProductId,
        productIds,
        action: 'Desvincular os produtos registrados, desativar a identidade central e marcar a revisão como ROLLED_BACK.'
    };
    if (!apply) return { dryRun: true, ...preview };

    return prisma.$transaction(async tx => {
        const unlinkResult = await tx.product.updateMany({
            where: {
                id: { in: productIds },
                organizationProductId: review.appliedOrganizationProductId,
                establishment: { organizationId: scope.organizationId }
            },
            data: { organizationProductId: null }
        });
        await tx.organizationProduct.updateMany({
            where: { id: review.appliedOrganizationProductId, organizationId: scope.organizationId },
            data: { isActive: false }
        });
        await tx.organizationProductReview.update({
            where: { id: review.id },
            data: { status: 'ROLLED_BACK', reviewedAt: new Date() }
        });
        await tx.auditLog.create({
            data: {
                actionType: 'ROLLBACK_CONSOLIDATION',
                entityType: 'ORGANIZATION_PRODUCT',
                entityId: review.appliedOrganizationProductId,
                description: `Rollback operacional da revisão ${review.id}; ${unlinkResult.count} vínculo(s) removido(s).`,
                establishmentId: scope.id
            }
        });
        return { dryRun: false, idempotent: false, unlinked: unlinkResult.count, ...preview };
    });
}

async function run() {
    const scope = await getScope();
    const result = reviewId ? await rollback(scope) : await summarize(scope);
    console.log(JSON.stringify(result, null, 2));
}
