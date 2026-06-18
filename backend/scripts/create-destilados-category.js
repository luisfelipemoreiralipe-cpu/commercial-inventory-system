const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const establishments = await prisma.establishments.findMany();
    for (const est of establishments) {
        const cat = await prisma.category.findFirst({
            where: { name: 'Destilados', establishmentId: est.id }
        });
        if (!cat) {
            await prisma.category.create({
                data: { name: 'Destilados', establishmentId: est.id }
            });
            console.log('Created Destilados for', est.id);
        } else {
            console.log('Destilados already exists for', est.id);
        }
    }
}

run()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
