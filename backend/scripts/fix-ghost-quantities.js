const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const prods = await prisma.product.findMany({
    include: { productStocks: { include: { location: true } } }
  });
  
  let fixedCount = 0;
  
  for (const prod of prods) {
    let sum = 0;
    for (const ps of prod.productStocks) {
      sum += Number(ps.quantity);
    }
    const globalQty = Number(prod.quantity);
    const diff = globalQty - sum;
    
    // Se tiver diferença fantasma (Global > Soma Locais)
    if (diff > 0.001) {
      console.log(`[${prod.name}] Resolvendo diferença de ${diff} unidades...`);
      
      let targetLocationId = prod.defaultLocationId;
      if (!targetLocationId) {
        const defaultLoc = await prisma.stockLocation.findFirst({ where: { establishmentId: prod.establishmentId, isDefault: true }});
        targetLocationId = defaultLoc ? defaultLoc.id : null;
      }

      if (targetLocationId) {
        // Encontra ou cria o registro de estoque para o local principal
        const stockRecord = await prisma.productStock.upsert({
            where: { productId_locationId: { productId: prod.id, locationId: targetLocationId } },
            create: { productId: prod.id, locationId: targetLocationId, quantity: diff },
            update: { quantity: { increment: diff } }
        });

        // Cria uma movimentação de estoque para registrar isso no extrato
        await prisma.stockMovement.create({
            data: {
                productId: prod.id,
                productName: prod.name,
                type: 'IN',
                quantity: diff,
                previousQuantity: Number(stockRecord.quantity) - diff,
                newQuantity: Number(stockRecord.quantity),
                reference: 'Ajuste Automático do Sistema',
                reason: 'Ajuste Automático',
                establishmentId: prod.establishmentId,
                locationId: targetLocationId
            }
        });
        
        fixedCount++;
        console.log(`  -> Adicionado ${diff} em ${targetLocationId}`);
      } else {
        console.log(`  -> ALERTA: Nenhum local padrão encontrado para ${prod.name}`);
      }
    }
  }
  
  console.log(`\nConcluído. ${fixedCount} produtos corrigidos.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
