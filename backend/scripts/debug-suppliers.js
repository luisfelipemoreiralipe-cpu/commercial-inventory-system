/**
 * ─────────────────────────────────────────────────────────────
 *  debug-suppliers.js
 *  Lista todos os estabelecimentos e a quantidade de
 *  fornecedores vinculados a cada um.
 *  Use para identificar onde os fornecedores estão antes
 *  de rodar o clone-suppliers.js
 * ─────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('─'.repeat(60));
    console.log('🔎  Debug — Fornecedores por Estabelecimento');
    console.log('─'.repeat(60) + '\n');

    const estabelecimentos = await prisma.establishments.findMany({
        orderBy: { name: 'asc' },
    });

    if (estabelecimentos.length === 0) {
        console.log('⚠️  Nenhum estabelecimento encontrado no banco.');
        return;
    }

    for (const est of estabelecimentos) {
        const fornecedores = await prisma.supplier.findMany({
            where: { establishmentId: est.id },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        });

        const count = fornecedores.length;
        const icon  = count > 0 ? '📦' : '📭';

        console.log(`${icon}  ${est.name}`);
        console.log(`    ID : ${est.id}`);
        console.log(`    Qtd: ${count} fornecedor(es)`);

        if (count > 0) {
            fornecedores.forEach(f => console.log(`       • ${f.name}  (${f.id})`));
        }

        console.log('');
    }

    console.log('─'.repeat(60));
    console.log('✔️  Diagnóstico concluído.\n');
}

main()
    .catch(err => {
        console.error('\n💥 Erro fatal:', err.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
