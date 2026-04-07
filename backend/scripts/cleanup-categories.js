const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupCategories() {
  console.log('🧹 Limpando todas as categorias para aplicar a nova trava @@unique...');
  try {
    await prisma.category.deleteMany({});
    console.log('✅ Categorias removidas com sucesso!');
  } catch (err) {
    console.error('❌ Erro na limpeza:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupCategories();
