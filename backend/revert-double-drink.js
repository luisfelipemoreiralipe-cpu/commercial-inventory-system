const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ESTABLISHMENT_ID = 'e3dd7833-6cf6-4020-b712-4d5c788bff0c';

// Valores originais corretos (16 drinks × ficha técnica = R$ 7,92/drink = R$ 126,72 total)
// APEROL: 60ml/drink × 16 = 960ml | ESPUMANTE: 150ml/drink × 16 = 2400ml | AGUA COM GAS: 50ml/drink × 16 = 800ml
const ORIGINAL = {
    'APEROL':                  { qty: 960  },
    'ESPUMANTE SALTON SERIES': { qty: 2400 },
    'AGUA COM GAS':            { qty: 800  },
};

async function main() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const movements = await prisma.stockMovement.findMany({
        where: {
            reason: 'DOUBLE_DRINK',
            establishmentId: ESTABLISHMENT_ID,
            createdAt: { gte: today }
        }
    });

    if (movements.length === 0) {
        console.log('Nenhum movimento DOUBLE_DRINK encontrado hoje.');
        return;
    }

    console.log(`Revertendo ${movements.length} movimentos para os valores originais...\n`);

    let totalCost = 0;

    for (const mv of movements) {
        const product = await prisma.product.findUnique({ where: { id: mv.productId } });
        if (!product) continue;

        const original = ORIGINAL[product.name.trim()];
        if (!original) {
            console.log(`⚠️  Produto não mapeado: ${product.name}`);
            continue;
        }

        const unitCost    = Number(product.currentCost || 0);
        const newQty      = original.qty;
        const newCost     = newQty * unitCost;
        const diffQty     = mv.quantity - newQty; // quanto sobrou a mais (a devolver ao estoque)

        // Reverte o movimento
        await prisma.stockMovement.update({
            where: { id: mv.id },
            data: {
                quantity:    newQty,
                totalCost:   newCost,
                unitCost:    unitCost,
                newQuantity: mv.newQuantity + diffQty, // devolve o excesso
            }
        });

        // Devolve ao estoque o que foi descontado a mais
        await prisma.product.update({
            where: { id: product.id },
            data: { quantity: { increment: diffQty } }
        });

        totalCost += newCost;

        console.log(`✅ ${product.name.trim()}`);
        console.log(`   Quantidade: ${mv.quantity}ml → ${newQty}ml`);
        console.log(`   Custo: R$ ${mv.totalCost.toFixed(2)} → R$ ${newCost.toFixed(2)}`);
        console.log(`   Estoque: +${diffQty}ml devolvido\n`);
    }

    console.log('─'.repeat(50));
    console.log(`💰 Custo total da promoção (16 Aperol em Dobro): R$ ${totalCost.toFixed(2)}`);
    console.log(`   Por drink: R$ ${(totalCost / 16).toFixed(2)}`);
}

main().catch(e => {
    console.error('Erro:', e.message);
    process.exit(1);
});
