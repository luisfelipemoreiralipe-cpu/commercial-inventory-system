const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetStock() {
    try {
        console.log("Iniciando o Cutover de Estoque...");

        console.log("Limpando StockMovements...");
        await prisma.stockMovement.deleteMany({});

        console.log("Limpando Itens de Ordem de Compra...");
        await prisma.purchaseOrderItem.deleteMany({});
        
        console.log("Limpando Ordens de Compra...");
        await prisma.purchaseOrder.deleteMany({});

        console.log("Limpando Itens de Consumo...");
        await prisma.consumptionEventItem.deleteMany({});

        console.log("Limpando Eventos de Consumo...");
        await prisma.consumptionEvent.deleteMany({});

        console.log("Limpando Transferencias...");
        await prisma.stockTransfer.deleteMany({});

        console.log("Limpando Itens de Auditoria...");
        await prisma.stockAuditItem.deleteMany({});

        console.log("Limpando Auditorias...");
        await prisma.stockAudit.deleteMany({});

        console.log("Zerando estoques dos produtos...");
        const result = await prisma.product.updateMany({
            data: {
                quantity: 0
            }
        });

        console.log(`Sucesso! ${result.count} produtos tiveram a sua quantidade zerada.`);
        console.log("O banco de dados de movimentações foi zerado sem afetar Fichas Técnicas ou Quantidades Mínimas.");

    } catch (e) {
        console.error("Erro durante o reset de estoque:", e);
    } finally {
        await prisma.$disconnect();
    }
}

resetStock();
