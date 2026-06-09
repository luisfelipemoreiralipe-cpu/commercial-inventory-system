require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando limpeza de histórico...");

  // Encontrar o estabelecimento com nome contendo 'commercial'
  const establishments = await prisma.establishments.findMany({
    where: {
      name: {
        contains: 'commercial',
        mode: 'insensitive' // ignora maiúsculas/minúsculas
      }
    }
  });

  if (establishments.length === 0) {
    console.error("Nenhum estabelecimento encontrado com a palavra 'commercial'.");
    return;
  }

  // Se houver mais de um, pegar o primeiro e confirmar
  const establishment = establishments[0];
  const estId = establishment.id;
  console.log(`Estabelecimento encontrado: ${establishment.name} (ID: ${estId})`);

  try {
    const audits = await prisma.stockAudit.findMany({ where: { establishmentId: estId }, select: { id: true } });
    const auditIds = audits.map(a => a.id);

    const consumptionEvents = await prisma.consumptionEvent.findMany({ where: { establishmentId: estId }, select: { id: true } });
    const eventIds = consumptionEvents.map(e => e.id);

    const purchaseOrders = await prisma.purchaseOrder.findMany({ where: { establishmentId: estId }, select: { id: true } });
    const orderIds = purchaseOrders.map(p => p.id);

    console.log("Deletando histórico... Isso pode demorar alguns segundos.");

    const txQueries = [];

    // 1. Deletar Itens
    if (auditIds.length > 0) txQueries.push(prisma.stockAuditItem.deleteMany({ where: { auditId: { in: auditIds } } }));
    if (eventIds.length > 0) txQueries.push(prisma.consumptionEventItem.deleteMany({ where: { eventId: { in: eventIds } } }));
    if (orderIds.length > 0) {
      txQueries.push(prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: { in: orderIds } } }));
      txQueries.push(prisma.supplierPriceHistory.deleteMany({ where: { purchaseOrderId: { in: orderIds } } }));
    }

    // 2. Deletar Headers e Movimentações
    txQueries.push(prisma.stockAudit.deleteMany({ where: { establishmentId: estId } }));
    txQueries.push(prisma.consumptionEvent.deleteMany({ where: { establishmentId: estId } }));
    txQueries.push(prisma.purchaseOrder.deleteMany({ where: { establishmentId: estId } }));
    
    txQueries.push(prisma.stockMovement.deleteMany({ where: { establishmentId: estId } }));
    txQueries.push(prisma.auditLog.deleteMany({ where: { establishmentId: estId } }));
    
    // StockTransfers (se origem ou destino for esse estabelecimento)
    txQueries.push(prisma.stockTransfer.deleteMany({
      where: {
        OR: [
          { fromEstablishmentId: estId },
          { toEstablishmentId: estId }
        ]
      }
    }));

    // 3. Zerar o estoque dos produtos
    txQueries.push(prisma.product.updateMany({
      where: { establishmentId: estId },
      data: { quantity: 0 }
    }));

    // Executando em transação para garantir integridade
    await prisma.$transaction(txQueries);

    console.log("✅ Histórico transacional apagado com sucesso!");
    console.log("✅ Estoque de todos os produtos do estabelecimento foi zerado.");

  } catch (err) {
    console.error("❌ Ocorreu um erro durante a exclusão:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
