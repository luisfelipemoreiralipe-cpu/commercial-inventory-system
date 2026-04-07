const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  'Cervejas', 'Destilados', 'Refrigerantes', 
  'Sucos & Águas', 'Insumos', 'Limpeza', 
  'Carnes', 'Hortifruti', 'Embalagens'
];

async function main() {
  console.log('🌱 Iniciando o Seed Blindado de Categorias (upsert)...');
  
  const establishments = await prisma.establishment.findMany();

  for (const est of establishments) {
    console.log(`📂 Blindando Categorias para: ${est.nome_fantasia}`);
    
    for (const name of DEFAULT_CATEGORIES) {
      await prisma.category.upsert({
        where: {
          name_establishmentId: {
            name: name,
            establishmentId: est.id
          }
        },
        update: {}, // Não faz nada se já existir
        create: {
          name: name,
          establishmentId: est.id
        }
      });
      console.log(`   ✅ [${name}] pronto.`);
    }
  }
  console.log('✅ Sistema de categorias 100% blindado com Unique Constraint!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });