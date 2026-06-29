const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ORIGINAL_DRINKS = 3;
const NEW_DRINKS = 16;
const ESTABLISHMENT_ID = 'e3dd7833-6cf6-4020-b712-4d5c788bff0c';

async function main() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Busca movimentos de DOUBLE_DRINK de hoje
    const movements = await prisma.stockMovement.findMany({
        where: {
            reason: 'DOUBLE_DRINK',
            establishmentId: ESTABLISHMENT_ID,
            createdAt: { gte: today }
        }
    });

    if (movements.length === 0) {
        console.log('❌ Nenhum movimento DOUBLE_DRINK encontrado hoje.');
        return;
    }

    console.log(`📋 Encontrados ${movements.length} ingredientes do drink em dobro de hoje.\n`);

    const results = [];

    for (const mv of movements) {
        const product = await prisma.product.findUnique({ where: { id: mv.productId } });
        if (!product) {
            console.log(`⚠️  Produto não encontrado: ${mv.productId}`);
            continue;
        }

        const perDrinkQty   = mv.quantity / ORIGINAL_DRINKS;           // qtd por drink original
        const newTotalQty   = Math.round(perDrinkQty * NEW_DRINKS);    // nova qtd total
        const diffQty       = newTotalQty - mv.quantity;               // diferença a descontar do estoque
        const unitCost      = Number(product.currentCost || 0);
        const newTotalCost  = newTotalQty * unitCost;

        // Atualiza o movimento existente
        await prisma.stockMovement.update({
            where: { id: mv.id },
            data: {
                quantity:    newTotalQty,
                totalCost:   newTotalCost,
                unitCost:    unitCost,
                newQuantity: mv.newQuantity - diffQty,
            }
        });

        // Desconta a diferença do estoque atual do produto
        await prisma.product.update({
            where: { id: product.id },
            data: { quantity: { decrement: diffQty } }
        });

        results.push({
            produto:        product.name,
            qtdAntes:       mv.quantity,
            qtdDepois:      newTotalQty,
            custoUnitario:  unitCost,
            custoAntes:     mv.totalCost,
            custoDepois:    newTotalCost
        });
    }

    console.log('✅ Correção aplicada com sucesso!\n');
    console.log(`   ${ORIGINAL_DRINKS} drinks → ${NEW_DRINKS} drinks\n`);
    console.log('Ingrediente              | Qtd Antes | Qtd Agora | Custo Antes | Custo Agora');
    console.log('─'.repeat(85));

    let totalAntes = 0;
    let totalDepois = 0;

    results.forEach(r => {
        totalAntes  += r.custoAntes;
        totalDepois += r.custoDepois;
        console.log(
            `${r.produto.padEnd(25)}| ${String(r.qtdAntes).padStart(9)} | ${String(r.qtdDepois).padStart(9)} | R$ ${r.custoAntes.toFixed(2).padStart(9)} | R$ ${r.custoDepois.toFixed(2)}`
        );
    });

    console.log('─'.repeat(85));
    console.log(`${'TOTAL'.padEnd(25)}| ${''.padStart(9)} | ${''.padStart(9)} | R$ ${totalAntes.toFixed(2).padStart(9)} | R$ ${totalDepois.toFixed(2)}`);
    console.log(`\n💰 Custo total da promoção Drink em Dobro (16 drinks): R$ ${totalDepois.toFixed(2)}`);
}

main().catch(e => {
    console.error('Erro:', e.message);
    process.exit(1);
});
