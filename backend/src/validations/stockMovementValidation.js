const { z } = require('zod');

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const dateField = z.string().regex(datePattern, 'Data inválida.').refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Data inválida.');

const listQuerySchema = z.object({
    productId: z.string().uuid().optional(),
    supplierId: z.string().uuid().optional(),
    type: z.string().trim().min(1).max(40).optional(),
    movementType: z.enum(['entry', 'exit', 'adjustment']).optional(),
    reason: z.string().trim().min(1).max(80).optional(),
    dateFrom: dateField.optional(),
    dateTo: dateField.optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(10).max(100).optional(),
    limit: z.coerce.number().int().min(10).max(100).optional()
}).strict().refine(
    (value) => !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
    { message: 'Período inválido.', path: ['dateTo'] }
);

module.exports = { listQuerySchema };
