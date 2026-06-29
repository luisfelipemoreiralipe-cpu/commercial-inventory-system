const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const estId = '32638f69-422d-4d02-84f0-40b7ec68cae4'; // estabelecimento teste
        
        console.log("Seeding portioning recipe for testing...");

        // Create a source product
        let sourceProduct = await prisma.product.findFirst({
            where: { name: 'Dianteiro Bovino Inteiro', establishmentId: estId }
        });
        
        if (!sourceProduct) {
            sourceProduct = await prisma.product.create({
                data: {
                    name: 'Dianteiro Bovino Inteiro',
                    type: 'INVENTORY',
                    unit: 'KG',
                    isActive: true,
                    quantity: 1500, // Stock to test with
                    establishmentId: estId,
                    categoryId: (await prisma.category.findFirst({ where: { establishmentId: estId } }) || await prisma.category.create({ data: { name: 'Carnes', establishmentId: estId } })).id
                }
            });
            console.log("Created source product:", sourceProduct.name);
        } else {
            await prisma.product.update({
                where: { id: sourceProduct.id },
                data: { quantity: 1500, type: 'INVENTORY' }
            });
        }

        // Find or create target products
        const targetNames = ['Patinho Bovino', 'Acém Bovino', 'Retalhos (Dianteiro)'];
        const targets = [];
        for (const name of targetNames) {
            let t = await prisma.product.findFirst({
                where: { name, establishmentId: estId }
            });
            if (!t) {
                t = await prisma.product.create({
                    data: {
                        name,
                        type: 'INVENTORY',
                        unit: 'KG',
                        isActive: true,
                        quantity: 0,
                        establishmentId: estId,
                        categoryId: sourceProduct.categoryId
                    }
                });
                console.log("Created target product:", t.name);
            }
            targets.push(t);
        }

        // Check if recipe already exists
        let recipe = await prisma.portioningRecipe.findFirst({
            where: { sourceProductId: sourceProduct.id, establishmentId: estId }
        });

        if (recipe) {
            console.log("Recipe already exists, cleaning old items...");
            await prisma.portioningRecipeItem.deleteMany({
                where: { portioningRecipeId: recipe.id }
            });
        } else {
            console.log("Creating new recipe...");
            recipe = await prisma.portioningRecipe.create({
                data: {
                    sourceProductId: sourceProduct.id,
                    establishmentId: estId
                }
            });
        }

        // Add recipe items (60%, 30%, 10%)
        const percentages = [60, 30, 10];
        for (let i = 0; i < targets.length; i++) {
            await prisma.portioningRecipeItem.create({
                data: {
                    portioningRecipeId: recipe.id,
                    targetProductId: targets[i].id,
                    costAllocationPercentage: percentages[i]
                }
            });
            console.log(`Added target ${targets[i].name} with ${percentages[i]}%`);
        }

        console.log("Portioning seeding completed! Please check the UI.");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
