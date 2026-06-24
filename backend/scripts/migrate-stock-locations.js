const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando migração de locais de estoque...');

  // 1. Obter todos os estabelecimentos
  const establishments = await prisma.establishments.findMany();
  console.log(`Encontrados ${establishments.length} estabelecimentos.`);

  for (const establishment of establishments) {
    // 2. Criar ou encontrar o "Estoque Principal" (isDefault: true)
    let defaultLocation = await prisma.stockLocation.findFirst({
      where: {
        establishmentId: establishment.id,
        isDefault: true,
      },
    });

    if (!defaultLocation) {
      defaultLocation = await prisma.stockLocation.create({
        data: {
          name: 'Estoque Principal',
          isDefault: true,
          establishmentId: establishment.id,
        },
      });
      console.log(`[${establishment.name}] Criado "Estoque Principal" (ID: ${defaultLocation.id})`);
    } else {
      console.log(`[${establishment.name}] "Estoque Principal" já existente.`);
    }

    // 3. Obter todos os produtos deste estabelecimento
    const products = await prisma.product.findMany({
      where: { establishmentId: establishment.id },
    });

    let migratedProducts = 0;
    for (const product of products) {
      // Atualizar o produto para ter o Estoque Principal como defaultLocationId
      await prisma.product.update({
        where: { id: product.id },
        data: { defaultLocationId: defaultLocation.id },
      });

      // Criar o registro em ProductStock se não existir
      const existingStock = await prisma.productStock.findUnique({
        where: {
          productId_locationId: {
            productId: product.id,
            locationId: defaultLocation.id,
          },
        },
      });

      if (!existingStock) {
        await prisma.productStock.create({
          data: {
            productId: product.id,
            locationId: defaultLocation.id,
            quantity: product.quantity, // Migrar a quantidade global para este local
          },
        });
        migratedProducts++;
      }
    }
    console.log(`[${establishment.name}] Migrados saldos de ${migratedProducts} produtos para o Estoque Principal.`);
  }

  console.log('Migração de locais de estoque concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro na migração:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
