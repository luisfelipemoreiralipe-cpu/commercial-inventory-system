const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const products = await prisma.product.findMany({ where: { type: 'ASSET' } });
    console.table(products.map(p => ({ name: p.name, qty: p.quantity, unitPrice: p.unitPrice, val: Number(p.quantity) * Number(p.unitPrice) })));
}
run().finally(() => prisma.$disconnect());
