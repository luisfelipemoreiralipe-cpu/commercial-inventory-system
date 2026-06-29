const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const p = await prisma.product.findMany({
        where: { name: { contains: 'LIMÃO', mode: 'insensitive' } },
        include: { Recipe: { include: { items: true } } }
    });
    console.log(JSON.stringify(p, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
