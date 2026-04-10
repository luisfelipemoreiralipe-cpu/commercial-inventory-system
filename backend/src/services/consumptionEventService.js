const prisma = require('../utils/prisma');
const { consumeProduct, addStock } = require('./stockMovementService');

/**
 * 🔐 INICIAR EVENTO DE CONSUMO
 */
const startEvent = async ({ name, establishmentId, items }) => {
    return prisma.$transaction(async (tx) => {
        const event = await tx.consumptionEvent.create({
            data: {
                name,
                establishmentId,
                status: "OPEN"
            }
        });

        for (const item of items) {
            const product = await tx.product.findFirst({
                where: { id: item.productId, establishmentId }
            });

            if (!product) throw new Error(`Produto não encontrado ou acesso negado: ${item.productId}`);

            const packQty = Number(product.packQuantity || 1);
            const totalBaseWithdrawn = Number(item.units) * packQty;

            // Busca o custo atual (contexto estabelecimento)
            let unitCost = await tx.stockMovement.findFirst({
                where: { productId: product.id, establishmentId },
                orderBy: { createdAt: 'desc' },
                select: { unitCost: true }
            }).then(m => Number(m?.unitCost || 0));

            if (!unitCost || unitCost <= 0) {
                unitCost = Number(product.currentCost || product.unitPrice || 0);
            }

            await tx.consumptionEventItem.create({
                data: {
                    eventId: event.id,
                    productId: item.productId,
                    withdrawnQty: totalBaseWithdrawn,
                    unitCost: unitCost
                }
            });

            // Baixa no estoque
            await consumeProduct({
                productId: item.productId,
                quantity: totalBaseWithdrawn,
                establishmentId,
                reason: "MARKETING_EVENT_OUT",
                reference: `EVENTO: ${name}`
            }, tx);
        }

        return event;
    });
};

/**
 * 🔐 DEVOLVER SOBRAS DO EVENTO
 */
const checkInLeftovers = async ({ eventId, items, establishmentId }) => {
    return prisma.$transaction(async (tx) => {
        const event = await tx.consumptionEvent.findFirst({
            where: { id: eventId, establishmentId },
            include: { items: true }
        });

        if (!event) throw new Error("Evento não encontrado ou acesso negado.");
        if (event.status === "CLOSED") throw new Error("Evento já encerrado");

        for (const item of items) {
            const eventItem = event.items.find(ei => ei.productId === item.productId);
            if (!eventItem) continue;

            const product = await tx.product.findFirst({
                where: { id: item.productId, establishmentId }
            });

            if (!product) continue;

            const packQty = Number(product.packQuantity || 1);
            const totalBaseReturned = (Number(item.units) * packQty) + Number(item.looseQty || 0);

            if (totalBaseReturned > Number(eventItem.withdrawnQty)) {
                throw new Error(`Quantidade devolvida de ${product.name} maior que a retirada`);
            }

            await tx.consumptionEventItem.update({
                where: { id: eventItem.id },
                data: { returnedQty: totalBaseReturned }
            });

            // Devolve ao estoque se houve sobras
            if (totalBaseReturned > 0) {
                await addStock({
                    productId: item.productId,
                    quantity: totalBaseReturned,
                    establishmentId,
                    reason: "MARKETING_EVENT_IN",
                    reference: `RETORNO EVENTO: ${event.name}`,
                    unitCost: Number(eventItem.unitCost)
                }, tx);
            }
        }

        await tx.consumptionEvent.updateMany({
            where: { id: eventId, establishmentId },
            data: { status: "CLOSED", completedAt: new Date() }
        });

        return { success: true };
    });
};

/**
 * 🔐 RELATÓRIO DO EVENTO
 */
const getEventReport = async (eventId, establishmentId) => {
    const event = await prisma.consumptionEvent.findFirst({
        where: { id: eventId, establishmentId },
        include: { 
            items: { 
                include: { product: true } 
            } 
        }
    });

    if (!event) throw new Error("Evento não encontrado ou acesso negado.");

    let totalWithdrawnValue = 0;
    let totalReturnedValue = 0;

    const itemsReport = event.items.map(item => {
        const withdrawnVal = Number(item.withdrawnQty) * Number(item.unitCost);
        const returnedVal = Number(item.returnedQty) * Number(item.unitCost);
        const realVal = withdrawnVal - returnedVal;

        totalWithdrawnValue += withdrawnVal;
        totalReturnedValue += returnedVal;

        return {
            productId: item.productId,
            name: item.product.name,
            withdrawn: Number(item.withdrawnQty),
            returned: Number(item.returnedQty),
            unit: item.product.unit,
            purchaseUnit: item.product.purchaseUnit,
            cost: realVal
        };
    });

    return {
        id: event.id,
        name: event.name,
        status: event.status,
        createdAt: event.createdAt,
        completedAt: event.completedAt,
        totalWithdrawn: totalWithdrawnValue,
        totalReturned: totalReturnedValue,
        realCost: totalWithdrawnValue - totalReturnedValue,
        items: itemsReport
    };
};

/**
 * 🔐 LISTAR EVENTOS
 */
const listEvents = async (establishmentId) => {
    return prisma.consumptionEvent.findMany({
        where: { establishmentId },
        orderBy: { createdAt: 'desc' },
        include: { 
            _count: { select: { items: true } },
            items: { include: { product: true } }
        }
    });
};

module.exports = {
    startEvent,
    checkInLeftovers,
    getEventReport,
    listEvents
};
