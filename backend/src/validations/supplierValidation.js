const { z } = require('zod');

const createSupplierSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    cnpj: z.string().min(14, 'CNPJ inválido').max(18),
    phone: z.string().nullable().optional(),
    email: z.string().email('E-mail inválido').nullable().optional(),
});

const updateSupplierSchema = createSupplierSchema.partial();

module.exports = { createSupplierSchema, updateSupplierSchema };
