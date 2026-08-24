const { z } = require('zod');

const dateSchema = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato YYYY-MM-DD')
    .refine(value => {
        const date = new Date(`${value}T00:00:00.000Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }, 'Data inválida');

const operationalUseSchema = z.object({
    productId: z.string().uuid('Produto inválido'),
    locationId: z.string().uuid('Local de estoque inválido'),
    quantity: z.coerce.number().finite().positive('Quantidade deve ser maior que zero').max(1000000),
    responsibleSector: z.string().trim().max(120).optional().default(''),
    notes: z.string().trim().max(500).optional().default(''),
    periodFrom: dateSchema,
    periodTo: dateSchema
}).superRefine((data, context) => {
    if (data.periodFrom > data.periodTo) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['periodTo'],
            message: 'O fim do período deve ser igual ou posterior ao início'
        });
    }
});

module.exports = { operationalUseSchema };
