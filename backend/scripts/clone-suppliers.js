/**
 * ─────────────────────────────────────────────────────────────
 *  clone-suppliers.js
 *  Copia os fornecedores de um estabelecimento para outro.
 *  Apenas dados cadastrais (name, cnpj, phone, email) são
 *  copiados. Vínculos transacionais são ignorados.
 *
 *  USO:
 *    node scripts/clone-suppliers.js
 *
 *  ⚠️  Certifique-se de que o backend/.env aponta para o banco
 *      correto (produção ou local) antes de executar.
 * ─────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Configuração ────────────────────────────────────────────
// IDs diretos para evitar ambiguidade com nomes duplicados.
// Descobertos via: node scripts/debug-suppliers.js
//
// Lights com 8 fornecedores → fc6d9d2d-3d1b-49d2-8c9c-125fbd79fb0c
// park destino              → ⚠️  CONFIRME O ID CORRETO COM O USUÁRIO
//                             ef72fb93-2f3b-4bb2-997c-7cd80ee060cb
//                             6dcb1af1-3636-412c-9697-5da785c966f3

const ID_ORIGEM  = 'fc6d9d2d-3d1b-49d2-8c9c-125fbd79fb0c'; // Lights (8 fornecedores)
const ID_DESTINO = '6dcb1af1-3636-412c-9697-5da785c966f3';   // park
// ─────────────────────────────────────────────────────────────

async function main() {
    console.log('─'.repeat(60));
    console.log('🚚  Clone de Fornecedores');
    console.log('─'.repeat(60));

    if (ID_DESTINO === 'COLE_AQUI_O_ID_DO_PARK_CORRETO') {
        throw new Error(
            '⚠️  Configure o ID_DESTINO no topo do script antes de rodar!\n' +
            '   Opções encontradas:\n' +
            '     park (1): ef72fb93-2f3b-4bb2-997c-7cd80ee060cb\n' +
            '     park (2): 6dcb1af1-3636-412c-9697-5da785c966f3\n'
        );
    }

    // 1. Buscar os dois estabelecimentos por ID
    const origem = await prisma.establishments.findUnique({
        where: { id: ID_ORIGEM },
    });

    if (!origem) {
        throw new Error(`Estabelecimento de origem não encontrado: ID "${ID_ORIGEM}"`);
    }

    const destino = await prisma.establishments.findUnique({
        where: { id: ID_DESTINO },
    });

    if (!destino) {
        throw new Error(`Estabelecimento de destino não encontrado: ID "${ID_DESTINO}"`);
    }

    console.log(`\n📌 Origem : ${origem.name}  (${origem.id})`);
    console.log(`📌 Destino: ${destino.name}  (${destino.id})\n`);

    // 2. Buscar fornecedores da origem
    const fornecedoresOrigem = await prisma.supplier.findMany({
        where: { establishmentId: origem.id },
        orderBy: { name: 'asc' },
    });

    if (fornecedoresOrigem.length === 0) {
        console.log('⚠️  Nenhum fornecedor encontrado no estabelecimento de origem.');
        return;
    }

    console.log(`📦 ${fornecedoresOrigem.length} fornecedor(es) encontrado(s) em "${origem.name}":\n`);
    fornecedoresOrigem.forEach(f => console.log(`   • ${f.name}`));
    console.log('');

    // 3. Buscar fornecedores já existentes no destino (para evitar duplicatas)
    const fornecedoresDestino = await prisma.supplier.findMany({
        where: { establishmentId: destino.id },
        select: { name: true },
    });

    const nomesExistentes = new Set(
        fornecedoresDestino.map(f => f.name.toLowerCase().trim())
    );

    // 4. Copiar os que ainda não existem no destino
    let criados  = 0;
    let pulados  = 0;
    const erros  = [];

    console.log('─'.repeat(60));
    console.log('⚙️  Processando...\n');

    for (const fornecedor of fornecedoresOrigem) {
        const nomeNormalizado = fornecedor.name.toLowerCase().trim();

        if (nomesExistentes.has(nomeNormalizado)) {
            console.log(`⏭  PULADO  — "${fornecedor.name}" (já existe no destino)`);
            pulados++;
            continue;
        }

        try {
            await prisma.supplier.create({
                data: {
                    name            : fornecedor.name,
                    cnpj            : fornecedor.cnpj  ?? null,
                    phone           : fornecedor.phone ?? null,
                    email           : fornecedor.email ?? null,
                    establishmentId : destino.id,
                },
            });

            console.log(`✅ CRIADO  — "${fornecedor.name}"`);
            criados++;

        } catch (err) {
            console.error(`❌ ERRO    — "${fornecedor.name}": ${err.message}`);
            erros.push(fornecedor.name);
        }
    }

    // 5. Resumo final
    console.log('\n' + '─'.repeat(60));
    console.log('📊  Resumo da operação:');
    console.log(`   ✅ Criados : ${criados}`);
    console.log(`   ⏭  Pulados : ${pulados}  (já existiam no destino)`);
    console.log(`   ❌ Erros   : ${erros.length}`);
    if (erros.length > 0) {
        console.log(`   Falhas   : ${erros.join(', ')}`);
    }
    console.log('─'.repeat(60));
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
