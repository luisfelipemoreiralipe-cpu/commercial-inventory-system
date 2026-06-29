const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        where: { name: { contains: 'MEL', mode: 'insensitive' } },
        include: {
            stockMovements: {
                orderBy: { createdAt: 'desc' },
                take: 10
            }
        }
    });
    console.log(JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
