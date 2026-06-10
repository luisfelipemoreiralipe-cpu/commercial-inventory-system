const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const products = await prisma.product.findMany({
    where: { name: { contains: 'LIMÃO TAITI', mode: 'insensitive' } }
  });
  console.log("Products:");
  products.forEach(p => console.log(`ID: ${p.id}, Name: ${p.name}, Cost: ${p.currentCost}, PackQty: ${p.packQuantity}`));

  const suppliers = await prisma.productSupplier.findMany({
    where: { productId: products[0]?.id }
  });
  console.log("\nSuppliers:");
  suppliers.forEach(s => console.log(`SupplierID: ${s.supplierId}, Price: ${s.price}`));

  process.exit(0);
}

check();
