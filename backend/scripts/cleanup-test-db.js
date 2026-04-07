const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log("--- PRODUTOS ATUAIS ---");
    const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true, quantity: true, type: true }
    });
    console.log(JSON.stringify(products, null, 2));

    console.log("\n--- LIMPANDO DADOS ---");
    // 1. Limpar Auditorias
    const auditItems = await prisma.stockAuditItem.deleteMany({});
    const audits = await prisma.stockAudit.deleteMany({});
    console.log("Auditorias removidas:", audits.count, "Itens removidos:", auditItems.count);

    // 2. Limpar Movimentações
    const movements = await prisma.stockMovement.deleteMany({});
    console.log("Movimentações removidas:", movements.count);

    // 3. Reset de Estoque
    for (const p of products) {
        if (p.type !== 'INVENTORY') continue;

        let newQty = 0;
        const nameNormalized = p.name.toUpperCase();
        
        // Se for um produto de estoque, colocamos 950 como base de teste (ou 0 se for drink preparado)
        if (nameNormalized.includes("SMIRNOFF") || 
            nameNormalized.includes("BALENA") || 
            nameNormalized.includes("APEROL") || 
            nameNormalized.includes("ABSOLUTE") || 
            nameNormalized.includes("ESPUMANTE") ||
            nameNormalized.includes("GIN")) {
            newQty = 950;
        }
        
        await prisma.product.update({
            where: { id: p.id },
            data: { quantity: newQty }
        });
        console.log(`Estoque resetado para ${p.name}: ${newQty}`);
    }

    console.log("\n✅ Limpeza concluída!");
}

run()
    .catch(err => {
        console.error("❌ ERRO NO SCRIPT:");
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
