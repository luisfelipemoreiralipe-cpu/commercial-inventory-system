const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const item = await prisma.recipeItem.findFirst({
    where: { productId: '9dfc3b28-dbfe-43fb-b472-7bc05f013d39' }
  });
  console.dir(item, {depth: null});
}

main().catch(console.error).finally(() => prisma.$disconnect());
