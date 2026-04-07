const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../utils/prisma');
const { consumeProduct } = require('../services/stockMovementService');
const { convertToBaseUnit } = require('../utils/unitConverter');

const importCSV = asyncHandler(async (req, res) => {
    console.log("!!!!!!!!!!!!!!!!!! ESTOU NO ARQUIVO CERTO !!!!!!!!!!!!!!!!!!");

    // 🔒 1. Validar arquivo
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Arquivo CSV é obrigatório' });
    }

    const establishmentId = req.user.establishmentId;
    console.log("🛠️ PASSO 1: Verificando se existe auditoria aberta...");

    // 🔒 2. Bloquear se auditoria aberta
    const openAudit = await prisma.stockAudit.findFirst({
        where: { establishmentId, status: "OPEN" }
    });

    if (openAudit) {
        console.log("⛔ PAROU: Existe uma auditoria aberta para este estabelecimento.");
        return res.status(400).json({
            success: false,
            message: "Existe uma auditoria em andamento. Finalize antes de importar vendas."
        });
    }

    // 📄 3. Ler e Parsear CSV (VERSÃO ROBUSTA TECH LEAD)
    const fileContent = req.file.buffer.toString('utf-8');
    const lines = fileContent.split(/\r?\n/).filter(l => l.trim());
    
    if (lines.length < 2) return res.status(400).json({ success: false, message: 'Arquivo vazio ou sem dados' });

    // Detectar o delimitador mestre pelo cabeçalho (quem aparece mais: , ou ;)
    const header = lines[0];
    const commaCount = (header.match(/,/g) || []).length;
    const semiCount = (header.match(/;/g) || []).length;
    const delimiter = semiCount > commaCount ? ';' : ',';

    const dataLines = lines.slice(1);
    const parsed = [];

    for (let line of dataLines) {
        // Divide a linha pelo delimitador detectado
        const parts = line.split(delimiter);
        
        // Ignora linhas que não têm pelo menos 2 colunas reais
        if (parts.length < 2) continue;

        const productName = parts[0].trim().toUpperCase();
        
        // Limpeza da quantidade: remove espaços e garante ponto decimal
        const rawQty = parts[1].trim().replace(',', '.');
        const quantity = parseFloat(rawQty);

        // Só adiciona se o nome for válido e a quantidade for um número real maior que zero
        // Isso ignora automaticamente as linhas "fantasmas" do Excel (;;;)
        if (productName && !isNaN(quantity) && quantity > 0 && productName.replace(/[,;]/g, '') !== '') {
            parsed.push({
                product: productName,
                quantity: quantity
            });
        }
    }
    console.log("📊 PARSED FINAL (CONFERIR):", parsed);

    console.log("🛠️ PASSO 2: CSV lido. Total de linhas:", parsed.length);
    console.log("PARSED:", parsed);

    // 🔎 4. Busca em massa de produtos e receitas
    console.log("🛠️ PASSO 3: Scanner de Diagnóstico de Banco...");

    // 🟢 SCANNER: Lista todos os produtos do estabelecimento para conferência de nomes e IDs
    const allDbProducts = await prisma.product.findMany({
        where: { establishmentId },
        select: { id: true, name: true, isActive: true }
    });

    console.log("--- 📋 LISTA DE PRODUTOS NO BANCO PARA ESTE ESTABELECIMENTO ---");
    allDbProducts.forEach(p => {
        // Os colchetes [] servem para você ver se há espaços invisíveis no banco
        console.log(`> DB: [${p.name}] | Ativo: ${p.isActive} | ID: ${p.id}`);
    });
    console.log("-------------------------------------------------------------");

    const productNames = Array.from(new Set(parsed.map(p => p.product)));

    // Usamos queryRaw com TRIM para garantir que espaços no banco não quebrem a busca
    const dbProducts = await prisma.$queryRaw`
        SELECT * FROM "products" 
        WHERE TRIM(LOWER("name")) = ANY(${productNames.map(n => n.toLowerCase())})
        AND "establishmentId" = ${establishmentId}::uuid
        AND "isActive" = true
    `;

    console.log(`🛠️ PASSO 4: Busca concluída. Produtos encontrados no mapeamento: ${dbProducts.length}`);

    // Busca as receitas para os produtos encontrados
    const productIds = dbProducts.map(p => p.id);
    const recipes = await prisma.recipe.findMany({
        where: { productId: { in: productIds } },
        include: { items: { include: { product: true } } },
        skip: 0,
        take: 1000 // Aumentamos o limite para garantir que pegue todas as receitas
    });

    const productMap = new Map();
    dbProducts.forEach(p => {
        const recipe = recipes.find(r => r.productId === p.id);
        // Usamos trim() no mapeamento para garantir a comparação exata com o CSV
        productMap.set(p.name.trim().toUpperCase(), { ...p, Recipe: recipe });
    });

    // 🔒 5. Validar produtos não encontrados
    const errors = [];
    parsed.forEach(item => {
        if (!productMap.has(item.product)) {
            console.log(`❌ Produto não mapeado: ${item.product}`);
            errors.push({ product: item.product, error: 'Produto não encontrado' });
        }
    });

    if (errors.length > 0) {
        console.log("⛔ PAROU: Existem produtos no CSV que não existem no banco.");
        return res.status(400).json({ success: false, errors });
    }

    // 💣 6. Explosão de Ingredientes
    console.log("🛠️ PASSO 5: Iniciando Explosão de Ingredientes...");
    const totalDemand = {};

    try {
        for (const item of parsed) {
            const product = productMap.get(item.product);
            const saleQty = Number(item.quantity);

            if (product.type === 'INVENTORY') {
                if (!totalDemand[product.id]) {
                    totalDemand[product.id] = { id: product.id, name: product.name, qty: 0 };
                }
                const packQty = Number(product.packQuantity || 1);
                totalDemand[product.id].qty += saleQty * packQty;
            } else if (product.type === 'PRODUCTION') {
                if (!product.Recipe) {
                    console.log(`❌ ERRO: ${product.name} não tem receita.`);
                    return res.status(400).json({
                        success: false,
                        message: `Produto ${product.name} não possui Ficha Técnica.`
                    });
                }

                for (const rItem of product.Recipe.items) {
                    if (!rItem.product) throw new Error(`Ingrediente órfão em ${product.name}`);

                    const ingredient = rItem.product;
                    if (!totalDemand[ingredient.id]) {
                        totalDemand[ingredient.id] = { id: ingredient.id, name: ingredient.name, qty: 0 };
                    }

                    const neededBase = convertToBaseUnit(
                        Number(rItem.quantity) * saleQty,
                        ingredient.unit
                    );
                    totalDemand[ingredient.id].qty += neededBase;
                }
            }
        }
        console.log("📊 DEMANDA TOTAL CALCULADA:", JSON.stringify(totalDemand, null, 2));
    } catch (err) {
        console.error("❌ ERRO NA EXPLOSÃO:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }

    // 🚀 7. Execução Atômica
    console.log("🛠️ PASSO 6: Abrindo transação para baixar estoque...");
    await prisma.$transaction(async (tx) => {
        for (const productId in totalDemand) {
            const item = totalDemand[productId];
            console.log(`[BAIXA] Consumindo: ${item.name} | Quantidade: ${item.qty}`);
            await consumeProduct({
                productId: item.id,
                quantity: item.qty,
                establishmentId,
                reason: "SALE",
                reference: "CSV_IMPORT_CONSOLIDATED"
            }, tx);
        }
    });

    console.log("✅ SUCESSO: Importação concluída.");
    return res.json({
        success: true,
        message: 'Vendas processadas com sucesso!',
        processedItems: parsed.length,
        distinctIngredients: Object.keys(totalDemand).length
    });
});

module.exports = { importCSV };