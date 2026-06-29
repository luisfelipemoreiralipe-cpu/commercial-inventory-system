const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const prods = await prisma.product.findMany({
    where: { name: { contains: 'cerpa', mode: 'insensitive' } },
    include: {
      productStocks: { include: { location: true } }
    }
  });

  if (prods.length === 0) {
    console.log('No products found');
    return;
  }

  for (const prod of prods) {
    console.log('\n=========================');
    console.log(`ID: ${prod.id}`);
    console.log(`Name: ${prod.name}`);
    console.log(`Global Qty: ${prod.quantity}`);
    
    console.log('\n--- LOCATIONS ---');
    let sum = 0;
    for (const ps of prod.productStocks) {
      console.log(`Location: ${ps.location.name} -> Qty: ${ps.quantity}`);
      sum += Number(ps.quantity);
    }
    console.log(`Sum of locations: ${sum}`);
    console.log(`Difference (Global - Sum): ${Number(prod.quantity) - sum}`);

    const locIds = prod.productStocks.map(ps => ps.locationId);

    const lostMovements = await prisma.stockMovement.findMany({
      where: {
        productId: prod.id,
        locationId: { notIn: locIds }
      },
      include: { location: true }
    });

    if (lostMovements.length > 0) {
      console.log('\n--- MOVEMENTS TO UNKNOWN LOCATIONS ---');
      for (const mov of lostMovements) {
        console.log(`${mov.type} | Qty: ${mov.quantity} | Ref: ${mov.reference} | Loc: ${mov.location ? mov.location.name : 'NULL'} | Created: ${mov.createdAt}`);
      }
    }

    const nullMovements = await prisma.stockMovement.findMany({
      where: {
        productId: prod.id,
        locationId: null
      }
    });

    if (nullMovements.length > 0) {
      console.log('\n--- MOVEMENTS WITH NULL LOCATION ---');
      let sumNull = 0;
      for (const mov of nullMovements) {
        if (mov.type === 'IN') sumNull += Number(mov.quantity);
        else sumNull -= Number(mov.quantity);
      }
      console.log(`Net quantity impacted by NULL location movements: ${sumNull}`);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
