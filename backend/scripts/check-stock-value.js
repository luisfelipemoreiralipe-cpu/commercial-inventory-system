const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const products = await prisma.product.findMany({
        where: { isActive: true },
        include: { productSuppliers: true }
    });

    const values = products.map(p => {
        let cost = 0;
        let method = '';
        if (Number(p.currentCost) > 0) {
            cost = Number(p.currentCost) * Number(p.quantity);
            method = 'currentCost';
        } else {
            const bestPrice = p.productSuppliers.length > 0
                ? Math.min(...p.productSuppliers.map(s => Number(s.price)))
                : Number(p.unitPrice || 0);
            const unitCost = bestPrice / (Number(p.packQuantity) || 1);
            cost = unitCost * Number(p.quantity);
            method = 'fallback';
        }
        return {
            name: p.name,
            quantity: Number(p.quantity),
            unit: p.unit,
            packQty: Number(p.packQuantity),
            unitPrice: Number(p.unitPrice),
            currentCost: Number(p.currentCost),
            totalValue: cost,
            method
        };
    }).sort((a,b) => b.totalValue - a.totalValue);

    console.table(values.slice(0, 20));
    console.log('Total:', values.reduce((sum, p) => sum + p.totalValue, 0));
}

run().finally(() => prisma.$disconnect());
