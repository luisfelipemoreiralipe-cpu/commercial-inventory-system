const prisma = require('../utils/prisma');
const dbOrPrisma = db => db || prisma;

const findEstablishmentScope = (id, db) => dbOrPrisma(db).establishments.findUnique({
    where: { id }, select: { id: true, organizationId: true }
});
const findAll = (organizationId, db) => dbOrPrisma(db).organizationSupplier.findMany({
    where: { organizationId },
    include: { localSuppliers: { select: { id: true, name: true, cnpj: true, establishment: { select: { id: true, name: true } } } } },
    orderBy: { name: 'asc' }
});
const findById = (id, organizationId, db) => dbOrPrisma(db).organizationSupplier.findFirst({
    where: { id, organizationId },
    include: { localSuppliers: { select: { id: true, name: true, cnpj: true, establishmentId: true } } }
});
const create = (data, db) => dbOrPrisma(db).organizationSupplier.create({ data });
const update = (id, data, db) => dbOrPrisma(db).organizationSupplier.update({ where: { id }, data });
const findUnlinked = (organizationId, db) => dbOrPrisma(db).supplier.findMany({
    where: { organizationSupplierId: null, establishment: { organizationId } },
    select: { id: true, name: true, cnpj: true, establishmentId: true, establishment: { select: { id: true, name: true } } },
    orderBy: [{ name: 'asc' }, { establishmentId: 'asc' }]
});
const findForLink = (ids, organizationId, db) => dbOrPrisma(db).supplier.findMany({
    where: { id: { in: ids }, establishment: { organizationId } },
    select: { id: true, name: true, cnpj: true, establishmentId: true, organizationSupplierId: true }
});
const link = (ids, organizationSupplierId, organizationId, db) => dbOrPrisma(db).supplier.updateMany({
    where: { id: { in: ids }, establishment: { organizationId } }, data: { organizationSupplierId }
});
const findReviews = (organizationId, db) => dbOrPrisma(db).organizationSupplierReview.findMany({
    where: { organizationId }, orderBy: { updatedAt: 'desc' }
});
const findReview = (organizationId, candidateKey, db) => dbOrPrisma(db).organizationSupplierReview.findUnique({
    where: { organizationId_candidateKey: { organizationId, candidateKey } }
});
const upsertReview = (organizationId, candidateKey, data, db) => dbOrPrisma(db).organizationSupplierReview.upsert({
    where: { organizationId_candidateKey: { organizationId, candidateKey } },
    create: { organizationId, candidateKey, ...data }, update: data
});
const createAudit = (data, db) => dbOrPrisma(db).auditLog.create({ data });

module.exports = { findEstablishmentScope, findAll, findById, create, update, findUnlinked, findForLink, link, findReviews, findReview, upsertReview, createAudit };
