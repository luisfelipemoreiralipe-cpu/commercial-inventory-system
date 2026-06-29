const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Busca TODOS os movimentos DOUBLE_DRINK de hoje
    const movements = await prisma.stockMovement.findMany({
        where: {
            reason: { in: ['DOUBLE_DRINK', 'COURTESY'] },
            establishmentId: 'e3dd7833-6cf6-4020-b712-4d5c788bff0c',
            createdAt: { gte: today }
        },
        orderBy: { createdAt: 'asc' }
    });

    const productIds = [...new Set(movements.map(m => m.productId))];
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, type: true, packQuantity: true, purchaseUnit: true, unit: true }
    });
    const prodMap = Object.fromEntries(products.map(p => [p.id, p]));

    console.log('=== TODOS OS MOVIMENTOS DE HOJE ===\n');
    movements.forEach((x, i) => {
        const t = new Date(x.createdAt).toLocaleTimeString('pt-BR');
        const p = prodMap[x.productId];
        console.log(`[${i + 1}] ${t} | ${x.reason} | ${x.productName} | type: ${p?.type || 'N/A'} | qty: ${x.quantity} | ref: ${x.reference} | id: ${x.id}`);
    });

    console.log('\n=== DIAGNÓSTICO ===');
    const dd = movements.filter(m => m.reason === 'DOUBLE_DRINK');
    const ct = movements.filter(m => m.reason === 'COURTESY');

    console.log('\nDOUBLE_DRINK:');
    dd.forEach(m => {
        const p = prodMap[m.productId];
        console.log(`  ${p?.type || '?'} | ${m.productName} | qty=${m.quantity}`);
    });

    console.log('\nCOURTESY:');
    ct.forEach(m => {
        const p = prodMap[m.productId];
        console.log(`  ${p?.type || '?'} | ${m.productName} | qty=${m.quantity}`);
    });
}

main().catch(e => console.error('Erro:', e.message));
