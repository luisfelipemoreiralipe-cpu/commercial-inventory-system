const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const inferClassification = (product) => {
    const category = product.category.name.toUpperCase();
    const name = product.name.toUpperCase();
    if (product.type === 'ASSET') return 'EXCLUDED';
    if (name.includes('AÃ‡ÃšCAR') || name.includes('AÇÚCAR') || name.includes('AÇUCAR')) return 'CMV_BEVERAGES';
    if (['COMIDA', 'CARNE', 'MILKSHAKE', 'ALIMENTO'].some(term => category.includes(term))) return 'EXCLUDED';
    if (category.includes('LIMPEZA') || category.includes('HIGIENE')) return 'CLEANING';
    if (category.includes('DESCART') || category.includes('EMBALAGEM')) return 'DISPOSABLES';
    return 'CMV_BEVERAGES';
};

async function main() {
    const migrationRows = await prisma.$queryRaw`
        SELECT migration_name, checksum, started_at, finished_at, applied_steps_count, rolled_back_at, logs
        FROM "_prisma_migrations"
        WHERE migration_name = '20260429224355_add_transfer_costs'
    `;
    const transferColumns = await prisma.$queryRaw`
        SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND lower(table_name) LIKE '%transfer%'
        ORDER BY table_name, ordinal_position
    `;
    console.log('Migração presente apenas no banco:');
    console.table(migrationRows.map(row => ({ ...row, finished_at: row.finished_at?.toISOString() })));
    console.log('\nEstrutura atual das tabelas de transferência no banco:');
    console.table(transferColumns);

    const costColumns = await prisma.$queryRaw`
        SELECT table_name, column_name, data_type, numeric_precision, numeric_scale, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name IN ('unitCost', 'totalCost')
        ORDER BY table_name, column_name
    `;
    console.log('\nColunas de custo atuais no banco:');
    console.table(costColumns);

    const baseline = await prisma.$queryRaw`
        SELECT
            (SELECT COUNT(*)::int FROM "products") AS "productCount",
            (SELECT COALESCE(SUM("quantity"), 0)::text FROM "products") AS "productQuantity",
            (SELECT COUNT(*)::int FROM "purchase_order_items") AS "purchaseItemCount",
            (SELECT COUNT(*)::int FROM "purchase_order_items" WHERE "productId" IS NULL) AS "purchaseItemsWithoutProduct",
            (SELECT COUNT(*)::int FROM "stock_movements") AS "movementCount",
            (SELECT COUNT(*)::int FROM "stock_movements" WHERE "productId" IS NULL) AS "movementsWithoutProduct",
            (SELECT COALESCE(SUM("quantity"), 0)::text FROM "stock_movements") AS "movementQuantity",
            (SELECT COALESCE(SUM("totalCost"), 0)::text FROM "stock_movements") AS "movementCost"
    `;
    console.log('\nLinha de base para conferência pós-migração (campos que não podem mudar):');
    console.table(baseline);

    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: {
            id: true,
            name: true,
            type: true,
            quantity: true,
            currentCost: true,
            category: true,
            establishment: { select: { name: true } }
        }
    });

    const groups = new Map();
    for (const product of products) {
        const inferred = inferClassification(product);
        const key = `${product.establishment.name}::${product.category.name}::${inferred}`;
        const current = groups.get(key) || {
            estabelecimento: product.establishment.name,
            categoria: product.category.name,
            produtos: 0,
            classificacaoSugerida: inferred
        };
        current.produtos += 1;
        groups.set(key, current);
    }

    console.table([...groups.values()].sort((a, b) =>
        a.estabelecimento.localeCompare(b.estabelecimento)
        || a.classificacaoSugerida.localeCompare(b.classificacaoSugerida)
        || a.categoria.localeCompare(b.categoria)
    ));

    const classificationSummary = new Map();
    for (const product of products) {
        const classification = inferClassification(product);
        const key = `${product.establishment.name}::${classification}`;
        const current = classificationSummary.get(key) || {
            estabelecimento: product.establishment.name,
            classificacao: classification,
            produtos: 0,
            saldoTotal: 0,
            custoAtualSomado: 0
        };
        current.produtos += 1;
        current.saldoTotal += Number(product.quantity || 0);
        current.custoAtualSomado += Number(product.currentCost || 0);
        classificationSummary.set(key, current);
    }

    console.log('\nResumo final simulado pela regra exata da migração:');
    console.table([...classificationSummary.values()].sort((a, b) =>
        a.estabelecimento.localeCompare(b.estabelecimento) || a.classificacao.localeCompare(b.classificacao)
    ));

    const operationalKeywords = ['LIMPEZA', 'DETERGENTE', 'DESINFETANTE', 'PAPEL', 'SACO DE LIXO', 'LUVA', 'GUARDANAPO', 'CANUDO', 'COPO', 'EMBALAGEM'];
    console.log('\nPossíveis materiais operacionais identificados pelo nome:');
    console.table(products.filter(product =>
        operationalKeywords.some(keyword => product.name.toUpperCase().includes(keyword))
    ).map(product => ({
        estabelecimento: product.establishment.name,
        categoria: product.category.name,
        produto: product.name,
        classificacaoSugerida: inferClassification(product)
    })));

    const ambiguousCategories = ['ALIMENTOS', 'HORTIFRUTI', 'INSUMOS', 'COMIDA', 'CARNES TESTE E2E', 'MILKSHAKE'];
    console.log('\nProdutos em categorias ambíguas:');
    console.table(products
        .filter((product) => ambiguousCategories.includes(product.category.name.toUpperCase()))
        .map((product) => ({
            estabelecimento: product.establishment.name,
            categoria: product.category.name,
            produto: product.name,
            tipo: product.type,
            classificacaoSugerida: inferClassification(product)
        }))
        .sort((a, b) => a.estabelecimento.localeCompare(b.estabelecimento)
            || a.categoria.localeCompare(b.categoria)
            || a.produto.localeCompare(b.produto)));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
