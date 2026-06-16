const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCosts() {
    const products = await prisma.product.findMany({
        where: { isActive: true },
        include: { productSuppliers: true }
    });

    for (const p of products) {
        let bestPrice = p.productSuppliers.length > 0
            ? Math.min(...p.productSuppliers.map(s => Number(s.price)))
            : Number(p.unitPrice || 0);
        
        let unitCost = bestPrice / (Number(p.packQuantity) || 1);

        // Fetch last purchase to see if there's a better actual purchase price
        const lastPurchase = await prisma.purchaseOrderItem.findFirst({
            where: { productId: p.id },
            orderBy: { createdAt: 'desc' }
        });

        if (lastPurchase?.unitPrice) {
            unitCost = Number(lastPurchase.unitPrice) / (Number(p.packQuantity) || 1);
        }

        // Only update if currentCost is different
        if (Math.abs(Number(p.currentCost) - unitCost) > 0.0001) {
            console.log(`Fixing ${p.name}: currentCost ${p.currentCost} -> ${unitCost}`);
            await prisma.product.update({
                where: { id: p.id },
                data: { currentCost: unitCost }
            });
        }
    }
    console.log("Fix complete.");
}

fixCosts().finally(() => prisma.$disconnect());
