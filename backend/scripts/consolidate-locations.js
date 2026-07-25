const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando consolidação de locais de estoque...");

    const establishments = await prisma.establishments.findMany();

    for (const est of establishments) {
        console.log(`\n=== Estabelecimento: ${est.name} ===`);
        
        // Find the default location
        let defaultLoc = await prisma.stockLocation.findFirst({
            where: { establishmentId: est.id, isDefault: true }
        });

        // If no default exists, pick the first one and make it default
        if (!defaultLoc) {
            defaultLoc = await prisma.stockLocation.findFirst({
                where: { establishmentId: est.id }
            });
            if (defaultLoc) {
                await prisma.stockLocation.update({
                    where: { id: defaultLoc.id },
                    data: { isDefault: true, name: 'Estoque Principal' }
                });
                console.log(`- Local definido como padrão: ${defaultLoc.name}`);
            }
        }

        if (!defaultLoc) {
            console.log(`Nenhum local encontrado para o estabelecimento.`);
            continue;
        }

        console.log(`- Estoque Principal selecionado: ${defaultLoc.name} (${defaultLoc.id})`);

        // Find all other locations
        const otherLocs = await prisma.stockLocation.findMany({
            where: {
                establishmentId: est.id,
                id: { not: defaultLoc.id }
            }
        });

        if (otherLocs.length === 0) {
            console.log(`- Nenhum local secundário para migrar.`);
            continue;
        }

        const otherLocIds = otherLocs.map(l => l.id);
        console.log(`- Locais a serem excluídos: ${otherLocs.map(l => l.name).join(', ')}`);

        // 1. Migrate Products (defaultLocationId)
        const productsUpdated = await prisma.product.updateMany({
            where: { defaultLocationId: { in: otherLocIds } },
            data: { defaultLocationId: defaultLoc.id }
        });
        console.log(`- Produtos atualizados: ${productsUpdated.count}`);

        // 2. Migrate StockMovements
        const movementsUpdated = await prisma.stockMovement.updateMany({
            where: { locationId: { in: otherLocIds } },
            data: { locationId: defaultLoc.id }
        });
        console.log(`- Movimentações de estoque atualizadas: ${movementsUpdated.count}`);

        // 3. Migrate StockAuditItems
        const auditsUpdated = await prisma.stockAuditItem.updateMany({
            where: { locationId: { in: otherLocIds } },
            data: { locationId: defaultLoc.id }
        });
        console.log(`- Itens de auditoria atualizados: ${auditsUpdated.count}`);

        // 4. Migrate ConsumptionEventItems
        const consumptionsUpdated = await prisma.consumptionEventItem.updateMany({
            where: { locationId: { in: otherLocIds } },
            data: { locationId: defaultLoc.id }
        });
        console.log(`- Itens de consumo atualizados: ${consumptionsUpdated.count}`);

        // 5. Merge ProductStock
        // Find all stock records in other locations
        const stocksToMigrate = await prisma.productStock.findMany({
            where: { locationId: { in: otherLocIds } }
        });

        for (const stock of stocksToMigrate) {
            // Upsert into default location
            await prisma.productStock.upsert({
                where: {
                    productId_locationId: {
                        productId: stock.productId,
                        locationId: defaultLoc.id
                    }
                },
                update: {
                    quantity: { increment: stock.quantity }
                },
                create: {
                    productId: stock.productId,
                    locationId: defaultLoc.id,
                    quantity: stock.quantity
                }
            });
            // Delete old stock record
            await prisma.productStock.delete({
                where: { id: stock.id }
            });
        }
        console.log(`- Saldos de estoque mesclados: ${stocksToMigrate.length}`);

        // 6. Delete the other locations
        for (const loc of otherLocs) {
            await prisma.stockLocation.delete({
                where: { id: loc.id }
            });
        }
        console.log(`- Locais excluídos com sucesso!`);
    }

    console.log("\n✅ Processo de consolidação finalizado com sucesso.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
