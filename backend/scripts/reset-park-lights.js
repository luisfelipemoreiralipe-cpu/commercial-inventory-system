/**
 * reset-park-lights.js
 *
 * Apaga TODOS os dados transacionais dos estabelecimentos "PARK" e "LIGHTS":
 *   - StockAuditItem / StockAudit
 *   - ConsumptionEventItem / ConsumptionEvent
 *   - PurchaseOrderItem / SupplierPriceHistory / PurchaseOrder
 *   - StockMovement
 *   - StockTransfer
 *   - AuditLog
 *
 * PRESERVA (não toca):
 *   - Fornecedores (Supplier)
 *   - Produtos (Product) — exceto zera quantity (estoque atual)
 *   - Preços de fornecedor (ProductSupplier)
 *   - Estoque mínimo (minQuantity)  ← mantido intacto
 *   - Categorias (Category)
 *   - Receitas (Recipe / RecipeItem)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Nomes (case-insensitive) dos estabelecimentos a limpar
const ESTABLISHMENT_NAMES = ['park', 'lights'];

async function resetEstablishment(est) {
    const estId = est.id;
    console.log(`\n🏢 Processando: ${est.name} (${estId})`);

    // ── Pré-busca de IDs dependentes ──────────────────────────────────────
    const audits = await prisma.stockAudit.findMany({
        where: { establishmentId: estId },
        select: { id: true }
    });
    const auditIds = audits.map(a => a.id);

    const events = await prisma.consumptionEvent.findMany({
        where: { establishmentId: estId },
        select: { id: true }
    });
    const eventIds = events.map(e => e.id);

    const orders = await prisma.purchaseOrder.findMany({
        where: { establishmentId: estId },
        select: { id: true }
    });
    const orderIds = orders.map(o => o.id);

    console.log(`   📋 Auditorias encontradas   : ${auditIds.length}`);
    console.log(`   🎉 Eventos de consumo       : ${eventIds.length}`);
    console.log(`   📦 Ordens de compra         : ${orderIds.length}`);

    // ── Deletar em ordem respeitando FKs ──────────────────────────────────
    const queries = [];

    // 1. Itens filhos (precisam vir antes dos pais)
    if (auditIds.length > 0)
        queries.push(prisma.stockAuditItem.deleteMany({ where: { auditId: { in: auditIds } } }));

    if (eventIds.length > 0)
        queries.push(prisma.consumptionEventItem.deleteMany({ where: { eventId: { in: eventIds } } }));

    if (orderIds.length > 0) {
        queries.push(prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: { in: orderIds } } }));
        queries.push(prisma.supplierPriceHistory.deleteMany({ where: { purchaseOrderId: { in: orderIds } } }));
    }

    // 2. Cabeçalhos / registros principais
    queries.push(prisma.stockAudit.deleteMany({ where: { establishmentId: estId } }));
    queries.push(prisma.consumptionEvent.deleteMany({ where: { establishmentId: estId } }));
    queries.push(prisma.purchaseOrder.deleteMany({ where: { establishmentId: estId } }));

    // 3. Movimentações e logs
    queries.push(prisma.stockMovement.deleteMany({ where: { establishmentId: estId } }));
    queries.push(prisma.auditLog.deleteMany({ where: { establishmentId: estId } }));

    // 4. Transferências (origem OU destino)
    queries.push(prisma.stockTransfer.deleteMany({
        where: {
            OR: [
                { fromEstablishmentId: estId },
                { toEstablishmentId: estId }
            ]
        }
    }));

    // 5. Zerar estoque atual — PRESERVA minQuantity, currentCost, etc.
    queries.push(prisma.product.updateMany({
        where: { establishmentId: estId },
        data: { quantity: 0 }
    }));

    await prisma.$transaction(queries);

    console.log(`   ✅ Dados transacionais apagados.`);
    console.log(`   ✅ Estoque (quantity) zerado.`);
    console.log(`   ✅ Estoque mínimo (minQuantity) preservado.`);
    console.log(`   ✅ Fornecedores, produtos e preços mantidos.`);
}

async function main() {
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  RESET PARK & LIGHTS — Dados Transacionais       ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('\n⚠️  Esta operação é irreversível. Iniciando...\n');

    const establishments = await prisma.establishments.findMany({
        where: {
            OR: ESTABLISHMENT_NAMES.map(name => ({
                name: { contains: name, mode: 'insensitive' }
            }))
        }
    });

    if (establishments.length === 0) {
        console.error('❌ Nenhum estabelecimento "Park" ou "Lights" encontrado.');
        return;
    }

    console.log(`🔍 Estabelecimentos encontrados: ${establishments.map(e => e.name).join(', ')}`);

    for (const est of establishments) {
        await resetEstablishment(est);
    }

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  ✅ CONCLUÍDO COM SUCESSO                         ║');
    console.log('╚══════════════════════════════════════════════════╝');
}

main()
    .catch(err => {
        console.error('\n❌ ERRO FATAL:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
