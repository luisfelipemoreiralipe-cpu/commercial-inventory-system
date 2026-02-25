const purchaseOrderRepo = require('../repositories/purchaseOrderRepository');
const auditLogRepo = require('../repositories/auditLogRepository');
const AppError = require('../utils/AppError');
const prisma = require('../utils/prisma');

// ─── Service ──────────────────────────────────────────────────────────────────
const getAllOrders = () => purchaseOrderRepo.findAll();

const getOrderById = async (id) => {
    const order = await purchaseOrderRepo.findById(id);
    if (!order) throw new AppError('Ordem de compra não encontrada.', 404);
    return order;
};

const createOrder = async (data) => {
    const order = await purchaseOrderRepo.create(data);

    await auditLogRepo.create({
        actionType: 'CREATE',
        entityType: 'PURCHASE_ORDER',
        entityId: order.id,
        description: `Ordem de compra #${order.id.slice(-6).toUpperCase()} criada com ${order.items.length} item(s).`,
    });

    return order;
};

/**
 * Complete a purchase order.
 *
 * Business rules (executed in a single DB transaction):
 *  1. Guard: order must exist and be in "pending" status.
 *  2. For every item that still has a valid linked product:
 *     a. Read current product quantity.
 *     b. Increment quantity by item.adjustedQuantity.
 *     c. Create a StockMovement record (type: "entry").
 *  3. Mark order as "completed".
 *  4. Create one AuditLog record.
 */
const completeOrder = async (orderId) => {
    const order = await getOrderById(orderId);

    if (order.status === 'completed') {
        throw new AppError('Esta ordem já foi concluída.', 400);
    }

    const ref = `Ordem de Compra #${orderId.slice(-6).toUpperCase()}`;

    const completedOrder = await prisma.$transaction(async (tx) => {
        // Process each item
        for (const item of order.items) {
            if (!item.productId) continue; // product was deleted — skip stock update

            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (!product) continue;

            const prevQty = product.quantity;
            const newQty = prevQty + item.adjustedQuantity;

            // Update stock
            await tx.product.update({
                where: { id: item.productId },
                data: { quantity: newQty },
            });

            // Record movement
            await tx.stockMovement.create({
                data: {
                    productId: item.productId,
                    productName: item.productName,
                    type: 'entry',
                    quantity: item.adjustedQuantity,
                    previousQuantity: prevQty,
                    newQuantity: newQty,
                    reference: ref,
                },
            });
        }

        // Mark order complete
        const updated = await tx.purchaseOrder.update({
            where: { id: orderId },
            data: { status: 'completed', completedAt: new Date() },
            include: { items: true },
        });

        // Audit log
        await tx.auditLog.create({
            data: {
                actionType: 'COMPLETE',
                entityType: 'PURCHASE_ORDER',
                entityId: orderId,
                description: `Ordem ${ref} concluída. ${order.items.length} produto(s) reabastecido(s).`,
            },
        });

        return updated;
    });

    return completedOrder;
};

const deleteOrder = async (id) => {
    await getOrderById(id);

    await purchaseOrderRepo.remove(id);

    await auditLogRepo.create({
        actionType: 'DELETE',
        entityType: 'PURCHASE_ORDER',
        entityId: id,
        description: `Ordem de compra #${id.slice(-6).toUpperCase()} excluída.`,
    });
};

module.exports = { getAllOrders, getOrderById, createOrder, completeOrder, deleteOrder };
