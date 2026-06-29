const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const prod = await prisma.product.findFirst({
    where: { name: { contains: 'Licor 43', mode: 'insensitive' } },
    include: { productStocks: { include: { location: true } } }
  });
  console.log(JSON.stringify(prod, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
