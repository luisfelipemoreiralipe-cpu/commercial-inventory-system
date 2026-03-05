const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {

  const establishment = await prisma.establishment.create({
    data: {
      nome_fantasia: "Restaurante Teste",
      cnpj: "00000000000100"
    }
  });

  const categories = [
    'Alimentos',
    'Bebidas',
    'Limpeza',
    'Embalagens',
    'Hortifruti',
    'Carnes'
  ];

  for (const name of categories) {
    await prisma.category.create({
      data: {
        name,
        establishmentId: establishment.id
      }
    });
  }

  console.log('🌱 Seed executado com sucesso');

}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });