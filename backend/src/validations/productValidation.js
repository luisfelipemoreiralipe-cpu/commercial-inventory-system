const { z } = require('zod');

const createProductSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    categoryId: z.string().uuid('ID de categoria inválido'),
    unit: z.string().min(1, 'Unidade é obrigatória'),
    type: z.enum(['INVENTORY', 'PRODUCTION', 'ASSET']),
    unitPrice: z.number().min(0, 'Preço deve ser positivo').optional().nullable(),
    quantity: z.number().min(0, 'Quantidade deve ser ≥ 0').default(0),
    minQuantity: z.number().min(0, 'Estoque mínimo deve ser ≥ 0').default(0),
    purchaseUnit: z.string().optional().nullable(),
    packQuantity: z.preprocess((val) => Number(val), z.number().min(0).optional().default(1)),
    defaultLocationId: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    purchaseClassification: z.enum([
        'CMV_BEVERAGES', 'CLEANING', 'DISPOSABLES', 'OPERATING', 'EXCLUDED'
    ]).optional().default('CMV_BEVERAGES'),
    restockFrequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ON_DEMAND'])
        .optional().default('ON_DEMAND'),
    idealQuantity: z.preprocess((val) => Number(val), z.number().min(0).optional().default(0)),
    trackInventory: z.boolean().optional().default(true),
    responsibleSector: z.string().trim().max(100).optional().nullable(),
});

const updateProductSchema = createProductSchema.partial();

const updateQuantitySchema = z.object({
    quantity: z.number({ required_error: 'Quantidade é obrigatória' })
        .min(0, 'Quantidade deve ser ≥ 0'),
    locationId: z.string().optional().nullable(),
});

module.exports = {
    createProductSchema,
    updateProductSchema,
    updateQuantitySchema
};
