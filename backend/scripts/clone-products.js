/**
 * ─────────────────────────────────────────────────────────────
 *  clone-products.js
 *  Copia produtos + vínculos de fornecedores (com preços) de
 *  um estabelecimento para outro.
 *
 *  O QUE É COPIADO:
 *    ✅ Dados cadastrais do produto (nome, unidade, tipo, etc.)
 *    ✅ Vínculo com categoria (por nome — cria se não existir)
 *    ✅ Vínculos ProductSupplier (preços por fornecedor)
 *
 *  O QUE NÃO É COPIADO:
 *    ❌ Quantidade em estoque (quantidade = 0 no destino)
 *    ❌ Movimentos de estoque, histórico de preços, pedidos
 *    ❌ Fichas técnicas (Recipes)
 *
 *  USO:
 *    node scripts/clone-products.js
 *
 *  ⚠️  Certifique-se de que o backend/.env aponta para o banco
 *      correto (produção/Supabase) antes de executar.
 * ─────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Configuração ─────────────────────────────────────────────
const ID_ORIGEM  = '6dcb1af1-3636-412c-9697-5da785c966f3'; // park  (origem)
const ID_DESTINO = 'fc6d9d2d-3d1b-49d2-8c9c-125fbd79fb0c'; // Lights (destino)
// ─────────────────────────────────────────────────────────────

async function findOrCreateCategory(name, establishmentId) {
    const existing = await prisma.category.findFirst({
        where: {
            name:            { equals: name, mode: 'insensitive' },
            establishmentId,
        },
    });

    if (existing) return existing;

    const created = await prisma.category.create({
        data: { name, establishmentId },
    });

    console.log(`   🗂️  Categoria criada no destino: "${name}"`);
    return created;
}

async function main() {
    console.log('─'.repeat(65));
    console.log('📦  Clone de Produtos + Preços + Vínculos de Fornecedor');
    console.log('─'.repeat(65));

    // 1. Validar os dois estabelecimentos
    const origem = await prisma.establishments.findUnique({
        where: { id: ID_ORIGEM },
    });
    if (!origem) throw new Error(`Origem não encontrada: ${ID_ORIGEM}`);

    const destino = await prisma.establishments.findUnique({
        where: { id: ID_DESTINO },
    });
    if (!destino) throw new Error(`Destino não encontrado: ${ID_DESTINO}`);

    console.log(`\n📌 Origem : ${origem.name}  (${origem.id})`);
    console.log(`📌 Destino: ${destino.name}  (${destino.id})\n`);

    // 2. Buscar produtos da origem com categoria e vínculos
    const produtosOrigem = await prisma.product.findMany({
        where: { establishmentId: ID_ORIGEM },
        include: {
            category: true,
            productSuppliers: {
                include: {
                    supplier: { select: { id: true, name: true } },
                },
            },
        },
        orderBy: { name: 'asc' },
    });

    if (produtosOrigem.length === 0) {
        console.log(`⚠️  Nenhum produto encontrado em "${origem.name}".`);
        return;
    }

    console.log(`📋 ${produtosOrigem.length} produto(s) encontrado(s) em "${origem.name}".\n`);

    // 3. Buscar produtos já existentes no destino (para evitar duplicatas)
    const produtosDestino = await prisma.product.findMany({
        where: { establishmentId: ID_DESTINO },
        select: { name: true },
    });
    const nomesExistentes = new Set(
        produtosDestino.map(p => p.name.toLowerCase().trim())
    );

    // 4. Buscar fornecedores do destino (para mapear vínculos)
    const fornecedoresDestino = await prisma.supplier.findMany({
        where: { establishmentId: ID_DESTINO },
        select: { id: true, name: true },
    });
    const mapFornecedores = new Map(
        fornecedoresDestino.map(s => [s.name.toLowerCase().trim(), s.id])
    );

    // 5. Processar cada produto
    console.log('─'.repeat(65));
    console.log('⚙️  Processando produtos...\n');

    let criados         = 0;
    let pulados         = 0;
    let vinculosCriados = 0;
    let vinculosPulados = 0;
    const erros         = [];

    for (const produto of produtosOrigem) {
        const nomeNorm = produto.name.toLowerCase().trim();

        // Pular se já existe no destino
        if (nomesExistentes.has(nomeNorm)) {
            console.log(`⏭  PULADO   — "${produto.name}" (já existe no destino)`);
            pulados++;
            continue;
        }

        try {
            // 5a. Encontrar ou criar a categoria no destino
            const categoriaDestino = await findOrCreateCategory(
                produto.category.name,
                ID_DESTINO
            );

            // 5b. Criar o produto no destino
            const novoProduto = await prisma.product.create({
                data: {
                    name            : produto.name,
                    unit            : produto.unit,
                    purchaseUnit    : produto.purchaseUnit ?? '',
                    packQuantity    : produto.packQuantity ?? 1,
                    type            : produto.type,
                    unitPrice       : produto.unitPrice ?? 0,
                    quantity        : 0,             // estoque zerado no destino
                    minQuantity     : produto.minQuantity ?? 0,
                    currentCost     : produto.currentCost ?? null,
                    isActive        : produto.isActive,
                    establishmentId : ID_DESTINO,
                    categoryId      : categoriaDestino.id,
                },
            });

            console.log(`✅ CRIADO   — "${produto.name}" [${produto.type}]`);
            criados++;

            // 5c. Criar vínculos com fornecedores
            if (produto.productSuppliers.length > 0) {
                for (const ps of produto.productSuppliers) {
                    const nomeForNorm = ps.supplier.name.toLowerCase().trim();
                    const idFornDestino = mapFornecedores.get(nomeForNorm);

                    if (!idFornDestino) {
                        console.log(`   ⚠️  Fornecedor não encontrado no destino: "${ps.supplier.name}" — vínculo ignorado`);
                        vinculosPulados++;
                        continue;
                    }

                    await prisma.productSupplier.create({
                        data: {
                            productId  : novoProduto.id,
                            supplierId : idFornDestino,
                            price      : ps.price,
                        },
                    });

                    console.log(`   🔗 Vínculo — "${ps.supplier.name}" @ R$ ${Number(ps.price).toFixed(2)}`);
                    vinculosCriados++;
                }
            }

        } catch (err) {
            console.error(`❌ ERRO     — "${produto.name}": ${err.message}`);
            erros.push(produto.name);
        }
    }

    // 6. Resumo final
    console.log('\n' + '─'.repeat(65));
    console.log('📊  Resumo da operação:');
    console.log(`   ✅ Produtos criados  : ${criados}`);
    console.log(`   ⏭  Produtos pulados  : ${pulados}  (já existiam no destino)`);
    console.log(`   🔗 Vínculos criados  : ${vinculosCriados}`);
    console.log(`   ⚠️  Vínculos pulados  : ${vinculosPulados}  (fornecedor não encontrado no destino)`);
    console.log(`   ❌ Erros             : ${erros.length}`);
    if (erros.length > 0) {
        console.log(`   Falhas: ${erros.join(', ')}`);
    }
    console.log('─'.repeat(65));
    console.log('✔️  Operação concluída.\n');
}

main()
    .catch(err => {
        console.error('\n💥 Erro fatal:', err.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
