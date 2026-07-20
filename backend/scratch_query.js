const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const whisky = await prisma.product.findFirst({
        where: { name: { contains: 'Passport', mode: 'insensitive' } },
        include: { stocks: { include: { location: true } } }
    });
    console.log('Whisky:', JSON.stringify(whisky, null, 2));
    
    const penicilin = await prisma.product.findFirst({
        where: { name: { contains: 'Penicilin', mode: 'insensitive' } },
        include: { Recipe: { include: { items: { include: { product: true } } } } }
    });
    console.log('Penicilin:', JSON.stringify(penicilin, null, 2));
}
main().finally(() => prisma.$disconnect());
