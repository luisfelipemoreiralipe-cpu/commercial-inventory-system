const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const p = await prisma.product.findUnique({
        where: { id: 'c2abf99d-1fc4-431c-bdf8-adcbe645419e' },
        include: { productSuppliers: true }
    });
    console.log(p.productSuppliers);
}
run().catch(console.error).finally(()=>prisma.$disconnect());
