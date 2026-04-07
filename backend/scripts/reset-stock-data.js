const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetStockData() {
    console.log('🚀 Iniciando limpeza PROFUNDA do banco de dados (Respeitando Constraints)...');
    
    try {
        // 1. Marketing / Eventos
        console.log('🗑️ Deletando ConsumptionEventItem & ConsumptionEvent...');
        await prisma.consumptionEventItem.deleteMany({});
        await prisma.consumptionEvent.deleteMany({});
        
        // 2. Auditorias
        console.log('🗑️ Deletando StockAuditItem & StockAudit...');
        await prisma.stockAuditItem.deleteMany({});
        await prisma.stockAudit.deleteMany({});

        // 3. Compras
        console.log('🗑️ Deletando PurchaseOrderItem & PurchaseOrder...');
        await prisma.purchaseOrderItem.deleteMany({});
        await prisma.purchaseOrder.deleteMany({});

        // 4. Receitas / Fichas Técnicas
        console.log('🗑️ Deletando RecipeItem & Recipe...');
        await prisma.recipeItem.deleteMany({});
        await prisma.recipe.deleteMany({});

        // 5. Históricos e Relatórios
        console.log('🗑️ Deletando StockMovement, StockTransfer & SupplierPriceHistory...');
        await prisma.stockMovement.deleteMany({});
        await prisma.stockTransfer.deleteMany({});
        await prisma.supplierPriceHistory.deleteMany({});
        await prisma.productSupplier.deleteMany({});

        // 6. Catálogo Base
        console.log('🗑️ Deletando Product...');
        await prisma.product.deleteMany({});
        
        console.log('🗑️ Deletando Category...');
        await prisma.category.deleteMany({});

        // Opcional: Se quiser limpar fornecedores também (comentado por segurança)
        // await prisma.supplier.deleteMany({});
        
        console.log('✅ BANCO DE DADOS LIMPO COM SUCESSO!');
        console.log('⚠️ Estruturas Core (User, Organization, Establishment, Supplier) preservadas.');

    } catch (error) {
        console.error('❌ ERRO DURANTE A LIMPEZA:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetStockData();
