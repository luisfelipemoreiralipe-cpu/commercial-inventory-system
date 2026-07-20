const prisma = require('./src/config/prisma');
const stockMovementService = require('./src/services/stockMovementService');

async function testNegativeStock() {
    try {
        // Encontra ou cria um produto INVENTORY qualquer
        const product = await prisma.product.findFirst({
            where: { type: 'INVENTORY' },
            include: { establishment: true }
        });

        if (!product) {
            console.log("Sem produtos para testar.");
            return;
        }

        const initialQuantity = Number(product.quantity);
        console.log(`Testando com produto: ${product.name} (ID: ${product.id}). Saldo Inicial Global: ${initialQuantity}`);

        // Forçar venda de (initialQuantity + 5) para forçar o negativo
        const sellQty = initialQuantity + 5;
        console.log(`Tentando vender: ${sellQty}`);

        let stockRecordBefore = await prisma.productStock.findFirst({
            where: { productId: product.id }
        });
        const initialStockQty = stockRecordBefore ? Number(stockRecordBefore.quantity) : 0;
        console.log(`Saldo Inicial Local Físico: ${initialStockQty}`);

        await prisma.$transaction(async (tx) => {
            await stockMovementService.consumeProduct({
                productId: product.id,
                quantity: sellQty,
                establishmentId: product.establishmentId,
                reason: 'SALE',
                reference: 'TEST-NEGATIVE'
            }, tx);
        });

        // Verificar como ficou no banco
        const finalProduct = await prisma.product.findUnique({ where: { id: product.id } });
        console.log(`Sucesso! Saldo Final Global: ${finalProduct.quantity}`);

        let stockRecordAfter = await prisma.productStock.findFirst({
            where: { productId: product.id }
        });
        console.log(`Saldo Final Local Físico: ${stockRecordAfter ? stockRecordAfter.quantity : 0}`);

        // Opcional: Reverter para não sujar a base (global)
        await prisma.product.update({
            where: { id: product.id },
            data: { quantity: initialQuantity }
        });

        // Reverter local
        if (stockRecordBefore) {
            await prisma.productStock.update({
                where: { id: stockRecordAfter.id },
                data: { quantity: stockRecordBefore.quantity }
            });
        }

    } catch (e) {
        console.error("ERRO:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

testNegativeStock();
