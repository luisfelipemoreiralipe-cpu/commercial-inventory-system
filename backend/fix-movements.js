const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log("Iniciando backfill de fornecedores em StockMovements...");
    const movements = await prisma.stockMovement.findMany({
        where: { supplierId: null }
    });

    console.log(`Encontrados ${movements.length} registros nulos...`);
    let count = 0;

    for (const m of movements) {
        if (!m.productId) continue;

        const ps = await prisma.productSupplier.findFirst({
            where: { productId: m.productId },
            orderBy: { price: 'asc' }
        });

        if (ps) {
            await prisma.stockMovement.update({
                where: { id: m.id },
                data: { supplierId: ps.supplierId }
            });
            count++;
        }
    }

    console.log(`Sucesso! Atualizados ${count} registros.`);
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
