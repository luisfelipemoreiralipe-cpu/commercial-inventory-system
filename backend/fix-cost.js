const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.product.updateMany({
        where: {
            id: 'c889e5c3-2b08-475e-8614-ebb160d802dd'
        },
        data: {
            currentCost: 0.0136,
            unitPrice: 13.60
        }
    });
    console.log('Product currentCost updated to 0.0136 (R$ 13,60 / 1000g)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
