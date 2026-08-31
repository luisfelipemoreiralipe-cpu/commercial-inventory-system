const { z } = require('zod');

const optionalText = max => z.string().trim().max(max).nullable().optional();

const createSchema = z.object({
    name: z.string().trim().min(2).max(160),
    legalName: optionalText(200),
    cnpj: optionalText(32),
    isActive: z.boolean().optional()
}).strict();

const updateSchema = createSchema.partial()
    .refine(data => Object.keys(data).length > 0, 'Informe ao menos um campo.');

const approveCandidateSchema = z.object({
    candidateKey: z.string().min(14).max(32),
    supplierIds: z.array(z.string().uuid()).min(2).max(100),
    name: z.string().trim().min(2).max(160),
    legalName: optionalText(200)
}).strict();

const rejectCandidateSchema = z.object({
    candidateKey: z.string().min(14).max(32)
}).strict();

module.exports = { createSchema, updateSchema, approveCandidateSchema, rejectCandidateSchema };
