const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMovements() {
    const movements = await prisma.stockMovement.findMany({
        include: { product: true }
    });

    let updated = 0;
    for (const m of movements) {
        if (!m.product) continue;

        // the product.currentCost has already been fixed by the previous script
        const correctUnitCost = Number(m.product.currentCost) || 0;
        const correctTotalCost = correctUnitCost * Number(m.quantity);

        const currentTotal = Number(m.totalCost || 0);

        // If the difference is significant (e.g., they were multiplying 1200 ml by 1.45 instead of 0.0024)
        if (Math.abs(currentTotal - correctTotalCost) > 1) {
            await prisma.stockMovement.update({
                where: { id: m.id },
                data: {
                    unitCost: correctUnitCost,
                    totalCost: correctTotalCost
                }
            });
            updated++;
        }
    }
    console.log(`Fixed ${updated} movements.`);
}

fixMovements().finally(() => prisma.$disconnect());
