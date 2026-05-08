/**
 * Script para remover produtos específicos do estabelecimento LIGHTS.
 * 
 * Produtos a remover:
 *   - smirnoff
 *   - absolute
 *   - GARRAGA - J. W. BLONDE
 *   - NÃO ALCOÓLICOS - TÔNICA
 *   - refrigerente errado
 * 
 * Branch: fix/remove-lights-products
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LIGHTS_ID = 'fc6d9d2d-3d1b-49d2-8c9c-125fbd79fb0c';

const PRODUCTS_TO_REMOVE = [
    { id: '11dc313c-d98b-4c68-b43a-86cebc3d2bb9', name: 'smirnoff' },
    { id: '15010d51-509a-4a82-8fc4-239a9e9efb66', name: 'absolute' },
    { id: '65325f56-81b2-43bd-bb5a-e796608a6c37', name: 'GARRAGA - J. W. BLONDE' },
    { id: '2c861405-9701-43ab-96d6-3f255de224eb', name: 'NÃO ALCOÓLICOS - TÔNICA' },
    { id: '6499924c-4bbc-41df-b965-97787d114990', name: 'refrigerente errado' },
];

async function removeProduct(productId, productName) {
    console.log(`\n🗑️  Removendo: "${productName}" (${productId})`);

    // 1. Remove consumption event items
    const consumptionItems = await prisma.consumptionEventItem.deleteMany({
        where: { productId }
    });
    console.log(`   ✅ ConsumptionEventItems removidos: ${consumptionItems.count}`);

    // 2. Remove stock audit items
    const auditItems = await prisma.stockAuditItem.deleteMany({
        where: { productId }
    });
    console.log(`   ✅ StockAuditItems removidos: ${auditItems.count}`);

    // 3. Remove stock movements
    const movements = await prisma.stockMovement.deleteMany({
        where: { productId }
    });
    console.log(`   ✅ StockMovements removidos: ${movements.count}`);

    // 4. Remove purchase order items
    const orderItems = await prisma.purchaseOrderItem.updateMany({
        where: { productId },
        data: { productId: null }
    });
    console.log(`   ✅ PurchaseOrderItems desvinculados: ${orderItems.count}`);

    // 5. Remove supplier price history
    const priceHistory = await prisma.supplierPriceHistory.deleteMany({
        where: { productId }
    });
    console.log(`   ✅ SupplierPriceHistory removidos: ${priceHistory.count}`);

    // 6. Remove product suppliers
    const productSuppliers = await prisma.productSupplier.deleteMany({
        where: { productId }
    });
    console.log(`   ✅ ProductSuppliers removidos: ${productSuppliers.count}`);

    // 7. Remove recipe items where this product is an ingredient
    const recipeItems = await prisma.recipeItem.deleteMany({
        where: { productId }
    });
    console.log(`   ✅ RecipeItems (como ingrediente) removidos: ${recipeItems.count}`);

    // 8. Remove recipe (if this product IS a recipe product)
    const recipe = await prisma.recipe.findUnique({
        where: { productId }
    });
    if (recipe) {
        // First remove recipe items OF this recipe
        await prisma.recipeItem.deleteMany({ where: { recipeId: recipe.id } });
        await prisma.recipe.delete({ where: { id: recipe.id } });
        console.log(`   ✅ Recipe própria removida: ${recipe.id}`);
    }

    // 9. Remove stock transfers
    const transfers = await prisma.stockTransfer.deleteMany({
        where: { productId }
    });
    console.log(`   ✅ StockTransfers removidos: ${transfers.count}`);

    // 10. Finally delete the product itself
    await prisma.product.delete({
        where: { id: productId }
    });
    console.log(`   ✅ Produto removido com sucesso!`);
}

async function run() {
    console.log('=== REMOÇÃO DE PRODUTOS DO LIGHTS ===');
    console.log(`Estabelecimento: LIGHTS (${LIGHTS_ID})`);
    console.log(`Produtos a remover: ${PRODUCTS_TO_REMOVE.length}\n`);

    // Verify all products exist before starting
    for (const p of PRODUCTS_TO_REMOVE) {
        const product = await prisma.product.findFirst({
            where: { id: p.id, establishmentId: LIGHTS_ID }
        });
        if (!product) {
            console.error(`❌ Produto não encontrado: "${p.name}" (${p.id})`);
            console.error('   Abortando operação.');
            return;
        }
        console.log(`✅ Confirmado: "${product.name}" (${product.id})`);
    }

    // Execute removal in a transaction-like fashion
    for (const p of PRODUCTS_TO_REMOVE) {
        await removeProduct(p.id, p.name);
    }

    console.log('\n🎉 Todos os produtos foram removidos com sucesso!');
}

run()
    .catch(err => {
        console.error('\n❌ ERRO:', err.message);
        console.error(err);
    })
    .finally(() => prisma.$disconnect());
