require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ests = await prisma.establishments.findMany({
        where: { name: { contains: 'lights', mode: 'insensitive' } }
    });

    if (ests.length === 0) {
        console.error('Nenhum estabelecimento Lights encontrado.');
        return;
    }

    console.log('Encontrados:', ests.map(e => `${e.name} (${e.id})`).join(', '));

    for (const est of ests) {
        const estId = est.id;
        console.log(`\nProcessando: ${est.name} (${estId})`);

        const audits  = await prisma.stockAudit.findMany({ where: { establishmentId: estId }, select: { id: true } });
        const events  = await prisma.consumptionEvent.findMany({ where: { establishmentId: estId }, select: { id: true } });
        const orders  = await prisma.purchaseOrder.findMany({ where: { establishmentId: estId }, select: { id: true } });

        const auditIds = audits.map(a => a.id);
        const eventIds = events.map(e => e.id);
        const orderIds = orders.map(o => o.id);

        console.log(`  Auditorias: ${auditIds.length} | Eventos: ${eventIds.length} | Ordens: ${orderIds.length}`);

        const queries = [];

        if (auditIds.length > 0)
            queries.push(prisma.stockAuditItem.deleteMany({ where: { auditId: { in: auditIds } } }));

        if (eventIds.length > 0)
            queries.push(prisma.consumptionEventItem.deleteMany({ where: { eventId: { in: eventIds } } }));

        if (orderIds.length > 0) {
            queries.push(prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: { in: orderIds } } }));
            queries.push(prisma.supplierPriceHistory.deleteMany({ where: { purchaseOrderId: { in: orderIds } } }));
        }

        queries.push(prisma.stockAudit.deleteMany({ where: { establishmentId: estId } }));
        queries.push(prisma.consumptionEvent.deleteMany({ where: { establishmentId: estId } }));
        queries.push(prisma.purchaseOrder.deleteMany({ where: { establishmentId: estId } }));
        queries.push(prisma.stockMovement.deleteMany({ where: { establishmentId: estId } }));
        queries.push(prisma.auditLog.deleteMany({ where: { establishmentId: estId } }));
        queries.push(prisma.stockTransfer.deleteMany({
            where: {
                OR: [
                    { fromEstablishmentId: estId },
                    { toEstablishmentId:   estId }
                ]
            }
        }));

        // Zera estoque atual — preserva minQuantity
        queries.push(prisma.product.updateMany({
            where: { establishmentId: estId },
            data:  { quantity: 0 }
        }));

        await prisma.$transaction(queries);

        console.log(`  ✅ ${est.name} zerado! (minQuantity e cadastros preservados)`);
    }

    console.log('\n✅ CONCLUÍDO.');
}

main()
    .catch(err => { console.error('ERRO:', err); process.exit(1); })
    .finally(() => prisma.$disconnect());
