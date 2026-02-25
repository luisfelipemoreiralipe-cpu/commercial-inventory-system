const { z } = require('zod');

const createCategorySchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
});

const updateCategorySchema = createCategorySchema.partial();

module.exports = { createCategorySchema, updateCategorySchema };
