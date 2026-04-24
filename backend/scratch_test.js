const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const purchaseOrderService = require('./src/services/purchaseOrderService');

(async () => {
  try {
    const order = await prisma.purchaseOrder.findFirst({
      where: { status: 'pending' },
      include: { items: true }
    });
    
    if (!order) {
      console.log('Nenhuma ordem de compra pendente encontrada');
      return;
    }
    
    console.log("Tentando receber ordem: ", order.id);
    
    const incomingItems = order.items.map(i => ({
      id: i.id,
      productId: i.productId,
      adjustedQuantity: Number(i.adjustedQuantity),
      unitPrice: Number(i.unitPrice)
    }));

    await purchaseOrderService.completeOrder(order.id, order.establishmentId, incomingItems);
    console.log("SUCESSO!");
  } catch (err) {
    console.error("ERRO REAL DETECTADO:");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
