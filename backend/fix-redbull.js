const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log("Procurando redbull para correção definitiva...");
    const products = await prisma.product.findMany({
        where: { name: { contains: 'redbull', mode: 'insensitive' } },
        include: { productSuppliers: true }
    });

    for(const p of products) {
        
        let baseCost = Number(p.currentCost || 0);
        let defaultSupplierId = null;

        if (p.productSuppliers.length > 0) {
            defaultSupplierId = p.productSuppliers[0].supplierId;
            if (baseCost === 0 && p.productSuppliers[0].price > 0) {
                baseCost = Number(p.productSuppliers[0].price);
            }
        }

        console.log(`Produto: ${p.name} | Custo Base Adotado: ${baseCost} | Fornecedor Padrão: ${defaultSupplierId}`);

        // Update product currentCost
        if (Number(p.currentCost || 0) !== baseCost) {
            await prisma.product.update({
                where: { id: p.id },
                data: { currentCost: baseCost }
            });
        }

        // Fix bonuses
        const bonuses = await prisma.stockMovement.findMany({
            where: { productId: p.id, type: 'IN', reason: 'BONUS' }
        });
        
        for(let m of bonuses) {
            let sId = m.supplierId || defaultSupplierId;
            let finalValue = baseCost * Number(m.quantity);

            console.log(`Atualizando Bônus: ${m.quantity} unidades -> Valor Real: ${finalValue}`);

            await prisma.stockMovement.update({
                where: { id: m.id },
                data: { supplierId: sId, totalCost: finalValue, unitCost: baseCost }
            });
        }
    }

    console.log("Correção finalizada!");
}
run().catch(console.error).finally(()=>prisma.$disconnect());
