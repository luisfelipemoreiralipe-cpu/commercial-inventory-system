const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const products = await prisma.product.findMany({
    where: { name: { contains: 'VODKA', mode: 'insensitive' } },
    include: { productStocks: { include: { location: true } } }
  });
  console.log(JSON.stringify(products, null, 2));
}
check().catch(console.error).finally(() => prisma.$disconnect());
