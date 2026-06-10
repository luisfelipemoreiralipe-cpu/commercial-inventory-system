const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const products = await prisma.product.findMany({
    where: { name: { contains: 'XAROPE', mode: 'insensitive' } }
  });
  
  if (products.length > 0) {
    const xarope = products[0];
    console.log(`Product: ${xarope.name}, Unit: ${xarope.unit}`);
    
    const recipe = await prisma.recipe.findFirst({
      where: { productId: xarope.id },
      include: { items: { include: { product: true } } }
    });
    
    if (recipe) {
      console.log('Recipe Items:');
      recipe.items.forEach(i => {
        console.log(`- ${i.product.name}: ${i.quantity} ${i.product.unit}`);
      });
    } else {
      console.log('No recipe found.');
    }
  }
  process.exit(0);
}

check();
