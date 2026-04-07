const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cloneBranch(sourceName, targetName) {
  console.log(`\n🔄 [CLONE] Iniciando clonagem: [${sourceName}] -> [${targetName}]`);

  // 1. Buscar os Estabelecimentos (nome_fantasia)
  const source = await prisma.establishment.findFirst({ 
    where: { nome_fantasia: { contains: sourceName, mode: 'insensitive' } } 
  });
  const target = await prisma.establishment.findFirst({ 
    where: { nome_fantasia: { contains: targetName, mode: 'insensitive' } } 
  });

  if (!source || !target) {
    throw new Error(`🚫 Estabelecimento [${!source ? sourceName : targetName}] não encontrado.`);
  }

  console.log(`📍 Origem: ${source.nome_fantasia} (${source.id})`);
  console.log(`📍 Destino: ${target.nome_fantasia} (${target.id})`);

  // 2. Mapear Categorias (Por Nome)
  console.log('\n📂 Sincronizando Categorias...');
  const sourceCategories = await prisma.category.findMany({ where: { establishmentId: source.id } });
  const targetCategories = await prisma.category.findMany({ where: { establishmentId: target.id } });
  
  const categoryMap = {}; 
  for (const sc of sourceCategories) {
    const match = targetCategories.find(tc => tc.name === sc.name);
    if (match) {
      categoryMap[sc.id] = match.id;
    } else {
      // Se não encontrar no seed, cria
      const newCat = await prisma.category.create({
        data: { name: sc.name, establishmentId: target.id }
      });
      categoryMap[sc.id] = newCat.id;
    }
  }
  console.log(`✅ Categorias mapeadas/criadas.`);

  // 3. Clonagem de Fornecedores
  console.log('\n🚚 Clonando Fornecedores...');
  const sourceSuppliers = await prisma.supplier.findMany({ where: { establishmentId: source.id } });
  const supplierMap = {};
  
  for (const supp of sourceSuppliers) {
    // Busca por nome no destino para evitar duplicatas (Simulação do Upsert)
    let targetSupp = await prisma.supplier.findFirst({
        where: { name: supp.name, establishmentId: target.id }
    });

    if (!targetSupp) {
        targetSupp = await prisma.supplier.create({
            data: {
                name: supp.name,
                cnpj: supp.cnpj,
                email: supp.email,
                phone: supp.phone,
                establishmentId: target.id
            }
        });
    }
    supplierMap[supp.id] = targetSupp.id;
  }
  console.log(`✅ ${sourceSuppliers.length} fornecedores processados.`);

  // 4. Clonagem de Produtos e Relacionamentos
  console.log('\n📦 Clonando Catálogo de Produtos...');
  const sourceProducts = await prisma.product.findMany({ 
    where: { establishmentId: source.id },
    include: { productSuppliers: true }
  });
  
  let productsCreated = 0;

  for (const prod of sourceProducts) {
    const exists = await prisma.product.findFirst({ 
        where: { name: prod.name, establishmentId: target.id } 
    });
    
    if (!exists) {
      const newProduct = await prisma.product.create({
        data: {
          name: prod.name,
          unit: prod.unit,
          purchaseUnit: prod.purchaseUnit,
          packQuantity: prod.packQuantity,
          currentCost: prod.currentCost,
          minQuantity: prod.minQuantity,
          type: prod.type,
          categoryId: categoryMap[prod.categoryId],
          establishmentId: target.id,
          quantity: 0, // ZERAR estoque na nova filial
          isActive: prod.isActive
        }
      });

      // Recriar vínculos com fornecedores
      if (prod.productSuppliers && prod.productSuppliers.length > 0) {
        for (const ps of prod.productSuppliers) {
            const targetSupplierId = supplierMap[ps.supplierId];
            if (targetSupplierId) {
                await prisma.productSupplier.create({
                    data: {
                        productId: newProduct.id,
                        supplierId: targetSupplierId,
                        price: ps.price
                    }
                });
            }
        }
      }
      productsCreated++;
    }
  }
  
  console.log(`✅ ${productsCreated} novos produtos clonados.`);
  console.log('\n🚀 [SUCESSO] Operação de clonagem de filial finalizada!');
}

// Execução padrão via CLI ou ajuste os nomes aqui
const [,, sourceName, targetName] = process.argv;

if (!sourceName || !targetName) {
    console.log('⚠️ Uso: node scripts/cloneBranch.js "Nome Origem" "Nome Destino"');
    console.log('Exemplo: node scripts/cloneBranch.js "park" "teste"');
    process.exit(1);
}

cloneBranch(sourceName, targetName)
  .catch((err) => {
    console.error('\n❌ [ERRO CRÍTICO]:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
