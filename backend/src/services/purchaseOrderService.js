const purchaseOrderRepo = require('../repositories/purchaseOrderRepository');
const auditLogRepo = require('../repositories/auditLogRepository');
const AppError = require('../utils/AppError');
const prisma = require('../utils/prisma');
const PDFDocument = require('pdfkit');

// ─── Service ──────────────────────────────────────────────────────────────────

const getAllOrders = () => purchaseOrderRepo.findAll();

const getOrderById = async (id) => {
    const order = await purchaseOrderRepo.findById(id);

    if (!order) {
        throw new AppError('Ordem de compra não encontrada.', 404);
    }

    return order;
};

const createOrder = async (data) => {

    const { establishmentId } = data;

    if (!establishmentId) {
        throw new AppError('EstablishmentId não informado.', 400);
    }

    const order = await purchaseOrderRepo.create(data);

    await auditLogRepo.create({
        actionType: 'CREATE',
        entityType: 'PURCHASE_ORDER',
        entityId: order.id,
        description: `Ordem de compra #${order.id.slice(-6).toUpperCase()} criada com ${order.items.length} item(s).`,
        establishmentId
    });

    return order;
};

const completeOrder = async (orderId, establishmentId) => {

    const order = await getOrderById(orderId);

    if (order.status === 'completed') {
        throw new AppError('Esta ordem já foi concluída.', 400);
    }

    const ref = `Ordem de Compra #${orderId.slice(-6).toUpperCase()}`;

    const completedOrder = await prisma.$transaction(async (tx) => {

        for (const item of order.items) {

            if (!item.productId) continue;

            const product = await tx.product.findUnique({
                where: { id: item.productId }
            });

            if (!product) continue;

            const prevQty = product.quantity;
            const newQty = prevQty + item.adjustedQuantity;

            await tx.product.update({
                where: { id: item.productId },
                data: {
                    quantity: newQty,

                    // 🔹 ATUALIZA O CUSTO DO PRODUTO
                    currentCost: item.unitPrice
                }
            });


            if (item.supplierId) {
                await tx.productSupplier.update({
                    where: {
                        productId_supplierId: {
                            productId: item.productId,
                            supplierId: item.supplierId
                        }
                    },
                    data: {
                        price: item.unitPrice
                    }
                });
            }
            await tx.supplierPriceHistory.create({
                data: {
                    productId: item.productId,
                    supplierId: item.supplierId,
                    price: item.unitPrice,
                    purchaseOrderId: orderId
                }
            });

            // Atualiza preço do fornecedor
            if (item.supplierId) {

                // Atualiza preço atual do fornecedor
                await tx.productSupplier.update({
                    where: {
                        productId_supplierId: {
                            productId: item.productId,
                            supplierId: item.supplierId
                        }
                    },
                    data: {
                        price: item.unitPrice
                    }
                });

                // Busca último preço registrado
                const lastPrice = await tx.supplierPriceHistory.findFirst({
                    where: {
                        productId: item.productId,
                        supplierId: item.supplierId
                    },
                    orderBy: {
                        createdAt: "desc"
                    }
                });

                // Salva histórico apenas se o preço mudou
                if (!lastPrice || Number(lastPrice.price) !== Number(item.unitPrice)) {

                    await tx.supplierPriceHistory.create({
                        data: {
                            productId: item.productId,
                            supplierId: item.supplierId,
                            price: item.unitPrice,
                            purchaseOrderId: orderId
                        }
                    });

                }

            }

            await tx.stockMovement.create({
                data: {
                    product: {
                        connect: { id: item.productId }
                    },

                    productName: item.productName,

                    type: 'IN',

                    quantity: item.adjustedQuantity,
                    previousQuantity: prevQty,
                    newQuantity: newQty,

                    reference: ref,

                }
            });

        }

        const updated = await tx.purchaseOrder.update({
            where: { id: orderId },
            data: {
                status: 'completed',
                completedAt: new Date()
            },
            include: { items: true }
        });

        await tx.auditLog.create({
            data: {
                actionType: 'COMPLETE',
                entityType: 'PURCHASE_ORDER',
                entityId: orderId,
                description: `Ordem ${ref} concluída. ${order.items.length} produto(s) reabastecido(s).`,
                establishment: {
                    connect: { id: establishmentId }
                }
            }
        });

        return updated;

    });

    return completedOrder;
};

const deleteOrder = async (id, establishmentId) => {

    await getOrderById(id);

    await purchaseOrderRepo.remove(id);

    await auditLogRepo.create({
        actionType: 'DELETE',
        entityType: 'PURCHASE_ORDER',
        entityId: id,
        description: `Ordem de compra #${id.slice(-6).toUpperCase()} excluída.`,
        establishmentId
    });

};

const createOrdersGroupedBySupplier = async (data) => {

    const { items, establishmentId, user_id } = data;

    const ordersBySupplier = {};

    for (const item of items) {

        const supplierId = item.supplierId;

        if (!supplierId) continue;

        if (!ordersBySupplier[supplierId]) {
            ordersBySupplier[supplierId] = [];
        }

        ordersBySupplier[supplierId].push(item);
    }

    const createdOrders = [];

    for (const supplierId in ordersBySupplier) {

        const orderData = {
            establishmentId,
            user_id,
            items: ordersBySupplier[supplierId].map(item => ({
                productId: item.productId,
                productName: item.productName,
                adjustedQuantity: item.adjustedQuantity,
                unitPrice: item.unitPrice,
                supplierId
            }))
        };

        const order = await purchaseOrderRepo.create(orderData);

        createdOrders.push(order);
    }

    return createdOrders;
};


// ─── GERAR PDF ────────────────────────────────────────────────────────────────

const generatePdf = async (orderId) => {

    const order = await prisma.purchaseOrder.findUnique({
        where: { id: orderId },
        include: { items: true }
    });

    if (!order) {
        throw new AppError('Ordem não encontrada.', 404);
    }

    const establishment = await prisma.establishment.findUnique({
        where: { user_id: order.user_id }
    });

    if (!establishment) {
        throw new AppError('Estabelecimento não encontrado.', 404);
    }

    const doc = new PDFDocument({ margin: 50 });

    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));

    // Cabeçalho

    doc.fontSize(18).text(establishment.nome_fantasia, { align: 'center' });

    doc.moveDown();

    doc.fontSize(10);

    doc.text(`CNPJ: ${establishment.cnpj || '-'}`);
    doc.text(`Telefone: ${establishment.telefone || '-'}`);
    doc.text(`${establishment.endereco || ''} - ${establishment.cidade || ''}/${establishment.estado || ''}`);

    doc.moveDown();

    doc.fontSize(14).text(`ORDEM DE COMPRA #${order.id.slice(-6).toUpperCase()}`);
    doc.text(`Status: ${order.status}`);
    doc.text(`Data: ${new Date(order.createdAt).toLocaleDateString('pt-BR')}`);

    doc.moveDown();

    doc.fontSize(12).text('Itens:');

    doc.moveDown();

    let total = 0;

    order.items.forEach(item => {

        const itemTotal = item.adjustedQuantity * item.unitPrice;

        total += itemTotal;

        doc.text(
            `${item.productName} | Qtd: ${item.adjustedQuantity} | R$ ${item.unitPrice.toFixed(2)} | Total: R$ ${itemTotal.toFixed(2)}`
        );

    });

    doc.moveDown();

    doc.fontSize(14).text(`VALOR TOTAL: R$ ${total.toFixed(2)}`, { align: 'right' });

    doc.end();

    return await new Promise(resolve => {
        doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

};

module.exports = {
    getAllOrders,
    getOrderById,
    createOrder,
    createOrdersGroupedBySupplier,
    completeOrder,
    deleteOrder,
    generatePdf
};