const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== INICIANDO SCRIPT DE MIGRAÇÃO E LIMPEZA ===");

    // 1. Encontrar todos os insumos de ALIMENTOS
    const categories = await prisma.category.findMany({
        where: { name: { contains: 'ALIMENTOS', mode: 'insensitive' } }
    });
    const categoryIds = categories.map(c => c.id);

    const foodProducts = await prisma.product.findMany({
        where: { categoryId: { in: categoryIds }, type: 'INVENTORY' },
        select: { id: true, name: true }
    });

    const foodIds = foodProducts.map(p => p.id);
    console.log(`Encontrados ${foodIds.length} insumos de ALIMENTOS para exclusão.`);

    if (foodIds.length > 0) {
        console.log("Apagando dependências dos insumos de ALIMENTOS...");

        // Excluir dependências (A ordem importa devido as FKs)
        await prisma.stockAuditItem.deleteMany({ where: { productId: { in: foodIds } } });
        await prisma.purchaseOrderItem.deleteMany({ where: { productId: { in: foodIds } } });
        await prisma.stockMovement.deleteMany({ where: { productId: { in: foodIds } } });
        await prisma.productSupplier.deleteMany({ where: { productId: { in: foodIds } } });
        await prisma.supplierPriceHistory.deleteMany({ where: { productId: { in: foodIds } } });
        await prisma.recipeItem.deleteMany({ where: { productId: { in: foodIds } } });
        await prisma.recipe.deleteMany({ where: { productId: { in: foodIds } } });
        await prisma.stockTransfer.deleteMany({ where: { OR: [{ productId: { in: foodIds } }, { destinationProductId: { in: foodIds } }] } });
        await prisma.consumptionEventItem.deleteMany({ where: { productId: { in: foodIds } } });
        await prisma.productionOrder.deleteMany({ where: { productId: { in: foodIds } } });
        await prisma.productStock.deleteMany({ where: { productId: { in: foodIds } } });
        await prisma.portioningRecipeItem.deleteMany({ where: { targetProductId: { in: foodIds } } });
        await prisma.portioningRecipe.deleteMany({ where: { sourceProductId: { in: foodIds } } });
        await prisma.portioningOrderItem.deleteMany({ where: { targetProductId: { in: foodIds } } });
        await prisma.portioningOrder.deleteMany({ where: { sourceProductId: { in: foodIds } } });

        // Finalmente, excluir os produtos
        const deletedProducts = await prisma.product.deleteMany({ where: { id: { in: foodIds } } });
        console.log(`Sucesso: ${deletedProducts.count} insumos excluídos permanentemente.`);
    }

    // 2. Migrar os outros insumos para o Estoque Principal
    console.log("\nIniciando migração dos insumos restantes para o Estoque Principal...");
    
    // Obter os locais de estoque principal
    const principalLocations = await prisma.stockLocation.findMany({
        where: { name: { contains: 'principal', mode: 'insensitive' } }
    });

    const establishmentToPrincipal = {};
    for (const loc of principalLocations) {
        establishmentToPrincipal[loc.establishmentId] = loc.id;
    }

    // Buscar insumos restantes
    const inventoryProducts = await prisma.product.findMany({
        where: { type: 'INVENTORY' }
    });

    let migratedProducts = 0;

    for (const product of inventoryProducts) {
        const principalId = establishmentToPrincipal[product.establishmentId];
        if (!principalId) continue; // Se não tiver estoque principal, ignora

        // Atualizar localização padrão do produto
        if (product.defaultLocationId !== principalId) {
            await prisma.product.update({
                where: { id: product.id },
                data: { defaultLocationId: principalId }
            });
        }

        // Buscar todos os saldos de estoque desse produto
        const stocks = await prisma.productStock.findMany({
            where: { productId: product.id }
        });

        if (stocks.length > 0) {
            let totalQuantity = 0;
            
            // Somar tudo
            for (const s of stocks) {
                totalQuantity += parseFloat(s.quantity);
            }

            // Excluir os registros de estoque existentes desse produto
            await prisma.productStock.deleteMany({
                where: { productId: product.id }
            });

            // Criar um único registro consolidado no estoque principal
            await prisma.productStock.create({
                data: {
                    productId: product.id,
                    locationId: principalId,
                    quantity: totalQuantity
                }
            });
            
            migratedProducts++;
        }
    }

    console.log(`Sucesso: ${migratedProducts} insumos consolidados no Estoque Principal.`);
    console.log("=== SCRIPT FINALIZADO COM SUCESSO ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
