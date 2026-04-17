const { z } = require('zod');

const purchaseOrderItemSchema = z.object({
    productId: z.string().uuid('productId inválido'),
    productName: z.string().min(1, 'Nome do produto é obrigatório'),
    supplierId: z.string().uuid('supplierId inválido').optional(),
    adjustedQuantity: z.number().min(0.01, 'Quantidade deve ser ≥ 0.01'),
    unitPrice: z.number().min(0, 'Preço unitário deve ser positivo'),
});

const createPurchaseOrderSchema = z.object({
    items: z
        .array(purchaseOrderItemSchema)
        .min(1, 'A ordem deve conter pelo menos 1 item'),
});

module.exports = { createPurchaseOrderSchema };
