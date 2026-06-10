const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const products = await prisma.product.findMany({
    where: { name: { contains: 'LIMÃO TAITI', mode: 'insensitive' } }
  });
  
  if(products.length > 0) {
    const limao = products[0];
    await prisma.product.update({
      where: { id: limao.id },
      data: { currentCost: 0.0037 }
    });
    console.log(`Updated cost for ${limao.name} to 0.0037`);
  }
  process.exit(0);
}

fix();
