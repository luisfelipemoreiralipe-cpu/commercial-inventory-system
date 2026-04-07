const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDia1() {
    console.log('🚀 Iniciando script de Hard Reset [Dia 1]...');

    try {
        // 1. Logs de auditoria
        await prisma.auditLog.deleteMany({});
        console.log('✅ AuditLogs deletados...');

        // 2. Transações de estoque e transferências
        await prisma.stockTransfer.deleteMany({});
        console.log('✅ Transferências entre estabelecimentos deletadas...');
        
        await prisma.stockMovement.deleteMany({});
        console.log('✅ Movimentações de estoque deletadas...');

        // 3. Auditorias de inventário
        await prisma.stockAuditItem.deleteMany({});
        await prisma.stockAudit.deleteMany({});
        console.log('✅ Histórico de auditorias físicas deletado...');

        // 4. Receitas/Fichas Técnicas (Referenciam produtos)
        await prisma.recipeItem.deleteMany({});
        await prisma.recipe.deleteMany({});
        console.log('✅ Fichas técnicas (receitas) deletadas...');

        // 5. Histórico de preços e pedidos
        await prisma.supplierPriceHistory.deleteMany({});
        console.log('✅ Histórico de preços de fornecedores deletado...');

        await prisma.purchaseOrderItem.deleteMany({});
        console.log('✅ Itens de pedidos de compra deletados...');

        await prisma.purchaseOrder.deleteMany({});
        console.log('✅ Ordens de compra deletadas...');

        // 6. Relações de catálogo
        await prisma.productSupplier.deleteMany({});
        console.log('✅ Relações Produto-Fornecedor deletadas...');

        // 7. Catálogo base (MANTENDO CATEGORIAS)
        await prisma.product.deleteMany({});
        console.log('✅ Catálogo de Produtos deletado...');

        await prisma.supplier.deleteMany({});
        console.log('✅ Cadastro de Fornecedores deletado...');

        console.log('\n✨ RESET CONCLUÍDO COM SUCESSO! ✨');
        console.log('📦 Infraestrutura (Usuários, Estabelecimentos e Categorias) PRESERVADA.');
    } catch (error) {
        console.error('❌ ERRO DURANTE O RESET:', error);
    } finally {
        await prisma.$disconnect();
        console.log('🔌 Prisma desconectado.');
    }
}

resetDia1();
