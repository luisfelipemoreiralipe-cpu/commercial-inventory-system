const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const prods = await prisma.product.findMany({
    include: { productStocks: true }
  });
  let discrepancies = 0;
  for (const prod of prods) {
    let sum = 0;
    for (const ps of prod.productStocks) {
      sum += Number(ps.quantity);
    }
    const globalQty = Number(prod.quantity);
    if (Math.abs(globalQty - sum) > 0.001) {
      console.log(`[${prod.name}] Global: ${globalQty} | Sum Loc: ${sum} | Diff: ${globalQty - sum}`);
      discrepancies++;
    }
  }
  console.log(`\nTotal discrepancies: ${discrepancies}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
