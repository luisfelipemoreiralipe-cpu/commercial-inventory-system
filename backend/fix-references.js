const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const movements = await prisma.stockMovement.findMany({
        where: {
            reason: { in: ['DOUBLE_DRINK', 'COURTESY'] },
            establishmentId: 'e3dd7833-6cf6-4020-b712-4d5c788bff0c',
            createdAt: { gte: today }
        }
    });

    console.log(`Found ${movements.length} movements to update.`);

    for (const mv of movements) {
        let newRef = mv.reference;
        
        // Se for o Aperol lançado hoje:
        if (mv.reason === 'DOUBLE_DRINK' && mv.reference.includes('APEROL EM DOBRO')) {
            newRef = mv.reference.replace('DRINK EM DOBRO', 'DRINK EM DOBRO [16 Aperol Spritz]');
        }
        
        // Se for a Cortesia lançada hoje:
        if (mv.reason === 'COURTESY' && mv.reference.includes('aniversário')) {
            newRef = mv.reference.replace('CORTESIA', 'CORTESIA [1 ESPUMANTE SALTON SERIES]');
        }

        if (newRef !== mv.reference) {
            await prisma.stockMovement.update({
                where: { id: mv.id },
                data: { reference: newRef }
            });
            console.log(`Updated ID ${mv.id} -> ${newRef}`);
        }
    }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
