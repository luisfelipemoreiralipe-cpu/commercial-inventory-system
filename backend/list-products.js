const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const products = await prisma.product.findMany({});
    console.log("Todos os produtos:");
    products.forEach(p => console.log(`${p.id} | ${p.name}`));
}
run().catch(console.error).finally(()=>prisma.$disconnect());
