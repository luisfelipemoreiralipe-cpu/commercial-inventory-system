const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        select: { id: true, name: true, establishmentId: true, quantity: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
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

    console.log(`Found ${duplicates.length} products with duplicates. Proceeding to merge...`);
    
    for (const dup of duplicates) {
        const original = dup.products[0];
        
        for (let i = 1; i < dup.products.length; i++) {
            const extra = dup.products[i];
            console.log(`Merging [${extra.name}] ${extra.id} (Qty: ${extra.quantity}) into ${original.id} (Qty: ${original.quantity})`);

            await prisma.$transaction(async (tx) => {
                // Update relations
                await tx.stockMovement.updateMany({
                    where: { productId: extra.id },
                    data: { productId: original.id }
                });

                await tx.stockTransfer.updateMany({
                    where: { destinationProductId: extra.id },
                    data: { destinationProductId: original.id }
                });

                await tx.stockTransfer.updateMany({
                    where: { productId: extra.id },
                    data: { productId: original.id }
                });
                
                await tx.consumptionEventItem.updateMany({
                    where: { productId: extra.id },
                    data: { productId: original.id }
                });

                // Delete the duplicate product
                await tx.product.delete({
                    where: { id: extra.id }
                });

                // Add quantity to original
                await tx.product.update({
                    where: { id: original.id },
                    data: {
                        quantity: { increment: extra.quantity }
                    }
                });
            });
        }
    }
    console.log("Merge completed successfully!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
