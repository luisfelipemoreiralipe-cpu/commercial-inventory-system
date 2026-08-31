const { z } = require('zod');
const positiveMoney = z.coerce.number().positive().max(99999999);

const listQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['DRAFT', 'SUBMITTED', 'APPLIED', 'REJECTED']).optional(),
    organizationSupplierId: z.string().uuid().optional(),
    search: z.string().trim().max(120).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional()
}).strict().refine(value => !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo, {
    message: 'Período inválido.', path: ['dateTo']
});

const createSchema = z.object({
    organizationSupplierId: z.string().uuid(),
    note: z.string().trim().max(1000).nullable().optional(),
    items: z.array(z.object({
        organizationProductId: z.string().uuid(),
        supplierCode: z.string().trim().max(100).nullable().optional(),
        commercialUnit: z.string().trim().min(1).max(30),
        unitsPerPackage: z.coerce.number().positive().max(1000000),
        packagePrice: positiveMoney,
        available: z.boolean().default(true),
        minimumOrder: z.coerce.number().positive().max(1000000).nullable().optional(),
        deliveryLeadDays: z.coerce.number().int().min(0).max(365).nullable().optional(),
        validUntil: z.string().datetime().nullable().optional()
    }).strict()).min(1).max(500)
}).strict();

const rejectSchema = z.object({ reason: z.string().trim().min(3).max(1000) }).strict();
module.exports = { listQuerySchema, createSchema, rejectSchema };
