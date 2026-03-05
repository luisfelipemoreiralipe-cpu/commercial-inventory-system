const { z } = require('zod');

const createProductSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    categoryId: z.string().uuid('ID de categoria inválido'),
    unit: z.string().min(1, 'Unidade é obrigatória'),
    unitPrice: z.number({ required_error: 'Preço unitário é obrigatório' }).min(0, 'Preço deve ser positivo'),
    quantity: z.number().int().min(0, 'Quantidade deve ser ≥ 0').default(0),
    minQuantity: z.number().int().min(0, 'Estoque mínimo deve ser ≥ 0').default(0),
});

const updateProductSchema = createProductSchema.partial();

const updateQuantitySchema = z.object({
    quantity: z.number({ required_error: 'Quantidade é obrigatória' })
        .int()
        .min(0, 'Quantidade deve ser ≥ 0'),
});

module.exports = {
    createProductSchema,
    updateProductSchema,
    updateQuantitySchema
};