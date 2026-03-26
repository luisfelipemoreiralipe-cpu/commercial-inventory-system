const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. cria establishment
  const establishment = await prisma.establishment.create({
    data: {
      nome_fantasia: "Restaurante Teste",
      cnpj: "00000000000100"
    }
  });

  // 2. cria usuário
  const user = await prisma.users.upsert({
    where: { email: "admin@teste.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@teste.com",
      senha_hash: passwordHash,

      establishment: {
        connect: { id: establishment.id }
      }
    }
  });

  // 3. cria vínculo 🔥 (ESSENCIAL)
  await prisma.userEstablishment.create({
    data: {
      userId: user.id,
      establishmentId: establishment.id,
      role: "ADMIN"
    }
  });

  // 4. categorias
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
        name
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