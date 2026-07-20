const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const establishments = await prisma.establishments.findMany();

        for (const est of establishments) {
            const hasDefault = await prisma.stockLocation.findFirst({
                where: { establishmentId: est.id, isDefault: true }
            });

            if (!hasDefault) {
                console.log(`Criando local default para o estabelecimento: ${est.name}`);
                await prisma.stockLocation.create({
                    data: {
                        name: "Estoque Principal",
                        establishmentId: est.id,
                        isDefault: true
                    }
                });
            }
        }
        console.log("Locais default configurados com sucesso.");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
