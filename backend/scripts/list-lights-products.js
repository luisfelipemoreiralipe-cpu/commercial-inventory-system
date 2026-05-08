const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    // Both LIGHTS establishments
    const lightsIds = [
        '9e65ab29-0c8f-4529-92f3-f262c786b87a',
        'fc6d9d2d-3d1b-49d2-8c9c-125fbd79fb0c'
    ];

    for (const id of lightsIds) {
        const est = await prisma.establishments.findUnique({ where: { id } });
        const products = await prisma.product.findMany({
            where: { establishmentId: id },
            include: { category: true }
        });

        console.log(`\n=== ${est.name} (${id}) - ${products.length} produtos ===`);
        products.forEach(p => console.log(`  ${p.id} | ${p.name} | Cat: ${p.category?.name || 'N/A'} | Qty: ${p.quantity}`));
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
