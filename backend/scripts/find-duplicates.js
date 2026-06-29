const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        select: { id: true, name: true, establishmentId: true, quantity: true, createdAt: true },
        orderBy: { createdAt: 'asc' } // older first
    });

    const map = {};
    const duplicates = [];

    products.forEach(p => {
        const key = `${p.establishmentId}|${p.name.trim().toLowerCase()}`;
        if (!map[key]) {
            map[key] = [];
        }
        map[key].push(p);
    });

    for (const key in map) {
        if (map[key].length > 1) {
            duplicates.push({ key, products: map[key] });
        }
    }

    console.log(`Found ${duplicates.length} products with duplicates.`);
    
    for (const dup of duplicates) {
        console.log(`\nDuplicate Group: ${dup.key}`);
        const original = dup.products[0];
        console.log(`  [ORIGINAL] ID: ${original.id} | Name: ${original.name} | Qty: ${original.quantity} | CreatedAt: ${original.createdAt}`);
        
        for (let i = 1; i < dup.products.length; i++) {
            const extra = dup.products[i];
            console.log(`  [DUPLICATE] ID: ${extra.id} | Name: ${extra.name} | Qty: ${extra.quantity} | CreatedAt: ${extra.createdAt}`);
            // Check if there are transfers for this duplicate
            const transfers = await prisma.stockTransfer.count({
                where: { destinationProductId: extra.id }
            });
            console.log(`    -> Referenced in ${transfers} stock transfers`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
