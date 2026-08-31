const prisma = require('../utils/prisma');

const dbOrPrisma = db => db || prisma;

const findEstablishmentScope = (establishmentId, db) => dbOrPrisma(db).establishments.findUnique({
    where: { id: establishmentId },
    select: { id: true, name: true, organizationId: true }
});

const findAll = (organizationId, db) => dbOrPrisma(db).organizationProduct.findMany({
    where: { organizationId },
    include: {
        localProducts: {
            select: {
                id: true,
                name: true,
                unit: true,
                purchaseUnit: true,
                packQuantity: true,
                isActive: true,
                establishment: { select: { id: true, name: true } }
            },
            orderBy: { name: 'asc' }
        }
    },
    orderBy: { internalCode: 'asc' }
});

const findById = (id, organizationId, db) => dbOrPrisma(db).organizationProduct.findFirst({
    where: { id, organizationId },
    include: {
        localProducts: {
            select: {
                id: true,
                name: true,
                unit: true,
                purchaseUnit: true,
                packQuantity: true,
                isActive: true,
                establishment: { select: { id: true, name: true } }
            }
        }
    }
});

const nextCodeNumber = async (organizationId, db) => {
    const sequence = await dbOrPrisma(db).organizationProductSequence.upsert({
        where: { organizationId },
        create: { organizationId, currentValue: 1 },
        update: { currentValue: { increment: 1 } },
        select: { currentValue: true }
    });
    return sequence.currentValue;
};

const create = (data, db) => dbOrPrisma(db).organizationProduct.create({ data });

const update = (id, data, db) => dbOrPrisma(db).organizationProduct.update({
    where: { id },
    data
});

const findProductsForLink = (productIds, organizationId, db) => dbOrPrisma(db).product.findMany({
    where: {
        id: { in: productIds },
        establishment: { organizationId }
    },
    select: {
        id: true,
        name: true,
        unit: true,
        purchaseUnit: true,
        packQuantity: true,
        establishmentId: true,
        establishment: { select: { id: true, name: true } },
        organizationProductId: true
    }
});

const findLocalLinks = (organizationProductId, db) => dbOrPrisma(db).product.findMany({
    where: { organizationProductId },
    select: { id: true, establishmentId: true }
});

const linkProducts = (productIds, organizationProductId, organizationId, db) => dbOrPrisma(db).product.updateMany({
    where: {
        id: { in: productIds },
        establishment: { organizationId }
    },
    data: { organizationProductId }
});

const findLinkedProduct = (productId, organizationProductId, organizationId, db) =>
    dbOrPrisma(db).product.findFirst({
        where: {
            id: productId,
            organizationProductId,
            establishment: { organizationId }
        },
        select: { id: true, name: true }
    });

const unlinkProduct = (productId, organizationProductId, organizationId, db) => dbOrPrisma(db).product.updateMany({
    where: {
        id: productId,
        organizationProductId,
        establishment: { organizationId }
    },
    data: { organizationProductId: null }
});

const findUnlinkedProducts = (organizationId, db) => dbOrPrisma(db).product.findMany({
    where: {
        organizationProductId: null,
        isActive: true,
        type: 'INVENTORY',
        purchaseClassification: { not: 'EXCLUDED' },
        establishment: { organizationId }
    },
    select: {
        id: true,
        name: true,
        unit: true,
        purchaseUnit: true,
        packQuantity: true,
        establishment: { select: { id: true, name: true } }
    },
    orderBy: [{ name: 'asc' }, { establishmentId: 'asc' }]
});

const findProductReviews = (organizationId, db) => dbOrPrisma(db).organizationProductReview.findMany({
    where: { organizationId },
    orderBy: { updatedAt: 'desc' }
});

const findProductReview = (organizationId, candidateKey, db) =>
    dbOrPrisma(db).organizationProductReview.findUnique({
        where: { organizationId_candidateKey: { organizationId, candidateKey } }
    });

const upsertProductReview = (organizationId, candidateKey, data, db) =>
    dbOrPrisma(db).organizationProductReview.upsert({
        where: { organizationId_candidateKey: { organizationId, candidateKey } },
        create: { organizationId, candidateKey, ...data },
        update: data
    });

const createAudit = (data, db) => dbOrPrisma(db).auditLog.create({ data });

module.exports = {
    findEstablishmentScope,
    findAll,
    findById,
    nextCodeNumber,
    create,
    update,
    findProductsForLink,
    findLocalLinks,
    linkProducts,
    findLinkedProduct,
    unlinkProduct,
    findUnlinkedProducts,
    findProductReviews,
    findProductReview,
    upsertProductReview,
    createAudit
};
