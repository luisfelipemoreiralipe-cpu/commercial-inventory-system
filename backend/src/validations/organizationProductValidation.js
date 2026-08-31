const { z } = require('zod');

const optionalText = max => z.string().trim().max(max).nullable().optional();

const createOrganizationProductSchema = z.object({
    name: z.string().trim().min(2).max(160),
    brand: optionalText(100),
    baseUnit: z.string().trim().min(1).max(30),
    barcode: optionalText(32),
    description: optionalText(1000),
    isActive: z.boolean().optional()
}).strict();

const updateOrganizationProductSchema = createOrganizationProductSchema
    .partial()
    .refine(data => Object.keys(data).length > 0, 'Informe ao menos um campo.');

const linkOrganizationProductsSchema = z.object({
    productIds: z.array(z.string().uuid()).min(1).max(500)
}).strict();

const candidateKey = z.string().min(3).max(500);

const approveProductCandidateSchema = z.object({
    candidateKey,
    productIds: z.array(z.string().uuid()).min(2).max(100),
    name: z.string().trim().min(2).max(160),
    brand: optionalText(100),
    baseUnit: z.string().trim().min(1).max(30),
    barcode: optionalText(32),
    description: optionalText(1000)
}).strict();

const rejectProductCandidateSchema = z.object({ candidateKey }).strict();

module.exports = {
    createOrganizationProductSchema,
    updateOrganizationProductSchema,
    linkOrganizationProductsSchema,
    approveProductCandidateSchema,
    rejectProductCandidateSchema
};
