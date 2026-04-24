const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../utils/prisma');
const { consumeProduct } = require('../services/stockMovementService');
const { convertToBaseUnit } = require('../utils/unitConverter');

async function explodeDemandRecursive(productOrId, saleQty, totalDemand, establishmentId, isRoot = true) {
    let product;
    let recipe;

    if (typeof productOrId === 'object' && productOrId.id) {
        product = productOrId;
        recipe = product.Recipe; 
    } else {
        product = await prisma.product.findFirst({ where: { id: productOrId, establishmentId } });
        if (!product) throw new Error(`Produto id ${productOrId} não encontrado`);
        if (product.type === 'PRODUCTION') {
            recipe = await prisma.recipe.findFirst({
                where: { productId: product.id, establishmentId },
                include: { items: { include: { product: true } } }
            });
        }
    }

    if (product.type === 'INVENTORY') {
        if (!totalDemand[product.id]) {
            totalDemand[product.id] = { id: product.id, name: product.name, qty: 0 };
        }
        if (isRoot) {
            const packQty = Number(product.packQuantity || 1);
            totalDemand[product.id].qty += saleQty * packQty;
        } else {
            totalDemand[product.id].qty += saleQty;
        }
    } else if (product.type === 'PRODUCTION') {
        if (!recipe) {
            recipe = await prisma.recipe.findFirst({
                where: { productId: product.id, establishmentId },
                include: { items: { include: { product: true } } }
            });
            if (!recipe) {
                throw new Error(`O produto "${product.name}" é de produção mas não possui Ficha Técnica cadastrada.`);
            }
        }

        for (const rItem of recipe.items) {
            if (!rItem.product) throw new Error(`Ingrediente órfão em ${product.name}`);
            
            const ingredient = rItem.product;
            const neededBase = convertToBaseUnit(
                Number(rItem.quantity) * saleQty,
                ingredient.unit
            );
            
            await explodeDemandRecursive(ingredient.id, neededBase, totalDemand, establishmentId, false);
        }
    }
}

/**
 * Normaliza quantidade em formato BR para float.
 * Suporta: "1.117" (milhar sem decimal), "1.117,5" (milhar com decimal), "1,5" (só decimal)
 */
function normalizeQuantity(raw) {
    if (!raw) return '';
    const str = raw.trim();

    // Se tem vírgula E ponto: formato BR completo (ex: "1.117,50") -> remover ponto, trocar vírgula por ponto
    if (str.includes('.') && str.includes(',')) {
        return str.replace(/\./g, '').replace(',', '.');
    }

    // Se só tem vírgula: pode ser decimal BR (ex: "1,5") -> trocar vírgula por ponto
    if (str.includes(',') && !str.includes('.')) {
        // Só é decimal se a parte após a vírgula tiver 1 ou 2 dígitos
        const afterComma = str.split(',')[1] || '';
        if (afterComma.length <= 2) {
            return str.replace(',', '.');
        }
        // Se tiver mais de 2 dígitos após vírgula, é separador de milhar (improvável, mas seguro)
        return str.replace(',', '');
    }

    // Se só tem ponto: pode ser milhar BR (ex: "1.117") ou decimal US (ex: "1.5")
    if (str.includes('.') && !str.includes(',')) {
        const afterDot = str.split('.')[1] || '';
        // Se exatamente 3 dígitos após ponto: interpretamos como separador de milhar
        if (afterDot.length === 3) {
            return str.replace('.', '');
        }
        // Caso contrário, é decimal normal
        return str;
    }

    // Sem separadores: número inteiro
    return str;
}

/**
 * Parser robusto de linha CSV que respeita campos entre aspas.
 */
function parseCSVLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

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
    let fileContent = req.file.buffer.toString('utf-8');

    // Detectar UTF-16LE e converter se necessário
    if (fileContent.includes('\x00')) {
        console.log("⚠️ Detectado encoding possivelmente incompatível (NUL bytes). Tentando converter de UTF-16LE...");
        fileContent = req.file.buffer.toString('utf-16le');
    }

    // Normalizar quebras de linha e filtrar vazias
    const lines = fileContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());

    console.log("DEBUG: Primeiras 3 linhas brutas:", JSON.stringify(lines.slice(0, 3)));

    if (lines.length < 2) {
        return res.status(400).json({ 
            success: false, 
            message: 'Arquivo vazio, sem dados ou formato de linha não reconhecido. Certifique-se de que o arquivo tem um cabeçalho e pelo menos uma linha de dados.' 
        });
    }

    // Detectar o delimitador mestre de forma robusta
    const header = lines[0];
    const firstData = lines[1] || "";
    
    const countChars = (str, char) => (str.match(new RegExp(`\\${char}`, 'g')) || []).length;
    
    const headerCommas = countChars(header, ',');
    const headerSemis = countChars(header, ';');
    const dataCommas = countChars(firstData, ',');
    const dataSemis = countChars(firstData, ';');

    // Decisão: Prioriza o que aparece nas linhas de dados, ou o que for majoritário no cabeçalho
    let delimiter = ',';
    if (dataSemis > dataCommas) {
        delimiter = ';';
    } else if (dataCommas === 0 && dataSemis === 0) {
        // Se a linha de dados não tem nenhum, decide pelo cabeçalho
        delimiter = headerSemis > headerCommas ? ';' : ',';
    }
    
    console.log(`🛠️ PASSO 2: Analisando CSV. Delimitador final: "${delimiter}" (Dados: ,:${dataCommas} ;:${dataSemis} | Header: ,:${headerCommas} ;:${headerSemis})`);

    const dataLines = lines.slice(1);
    const parsed = [];

    for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];

        // Parser robusto de CSV que respeita campos entre aspas
        const parts = parseCSVLine(line, delimiter);

        // Ignora linhas que não têm pelo menos 2 colunas reais
        if (parts.length < 2) {
            console.log(`⚠️ Linha ${i + 2} ignorada (colunas insuficientes): "${line}"`);
            continue;
        }

        const productName = parts[0].trim().replace(/^"|"$/g, '').toUpperCase();
        // Pega a quantidade e normaliza formato BR (ex: "1.117,5" -> 1117.5 | "1,5" -> 1.5)
        const rawQty = parts[1] ? parts[1].trim().replace(/^"|"$/g, '') : '';
        const normalizedQty = normalizeQuantity(rawQty);
        const quantity = parseFloat(normalizedQty);

        console.log(`🔢 Linha ${i + 2}: Produto=[${productName}] rawQty=[${rawQty}] normalizado=[${normalizedQty}] parsed=${quantity}`);

        // Só adiciona se o nome for válido e a quantidade for um número real maior que zero
        if (productName && !isNaN(quantity) && quantity > 0 && productName.replace(/[,;]/g, '') !== '') {
            parsed.push({
                product: productName,
                quantity: quantity
            });
        } else {
            console.log(`⚠️ Linha ${i + 2} ignorada (dados inválidos): "${line}" -> Produto: [${productName}], Qtd: [${rawQty}]`);
        }
    }

    console.log("🛠️ PASSO 3: CSV processado. Vendas válidas encontradas:", parsed.length);
    if (parsed.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Nenhuma venda válida foi encontrada no arquivo. Verifique se o nome do produto está na primeira coluna e a quantidade na segunda colunas, e se o delimitador (, ou ;) está correto.",
            debug: { header, linesFound: lines.length, delimiterDetected: delimiter }
        });
    }

    // 🔎 4. Busca em massa de produtos e receitas
    console.log("🛠️ PASSO 4: Scanner de Diagnóstico de Banco...");

    // 🟢 SCANNER: Lista todos os produtos do estabelecimento para conferência de nomes e IDs
    const allDbProducts = await prisma.product.findMany({
        where: { establishmentId },
        select: { id: true, name: true, isActive: true }
    });

    console.log("--- 📋 LISTA DE PRODUTOS NO BANCO PARA ESTE ESTABELECIMENTO ---");
    allDbProducts.forEach(p => {
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

    console.log(`🛠️ PASSO 5: Busca concluída. Produtos encontrados no mapeamento: ${dbProducts.length}`);

    // Busca as receitas para os produtos encontrados
    const productIds = dbProducts.map(p => p.id);
    const recipes = await prisma.recipe.findMany({
        where: { productId: { in: productIds } },
        include: { items: { include: { product: true } } },
        take: 5000 
    });

    const productMap = new Map();
    dbProducts.forEach(p => {
        const recipe = recipes.find(r => r.productId === p.id);
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
        return res.status(400).json({ 
            success: false, 
            message: "Alguns produtos do CSV não coincidem com o cadastro do sistema.",
            errors 
        });
    }

    // 💣 6. Explosão de Ingredientes
    console.log("🛠️ PASSO 6: Iniciando Explosão de Ingredientes (Recursiva)...");
    const totalDemand = {};

    try {
        for (const item of parsed) {
            const product = productMap.get(item.product);
            const saleQty = Number(item.quantity);
            await explodeDemandRecursive(product, saleQty, totalDemand, establishmentId, true);
        }
        console.log("📊 DEMANDA TOTAL CALCULADA:", JSON.stringify(totalDemand, null, 2));
    } catch (err) {
        console.error("❌ ERRO NA EXPLOSÃO:", err.message);
        return res.status(500).json({ success: false, message: err.message });
    }

    // 🚀 7. Pré-buscar custos FORA da transação para não estourar o timeout
    console.log("🛠️ PASSO 7: Pré-calculando custos fora da transação...");
    const { getProductCostOutsideTx } = require('../services/stockMovementService');
    const preloadedCosts = {};
    
    await Promise.all(
        Object.keys(totalDemand).map(async (productId) => {
            try {
                preloadedCosts[productId] = await getProductCostOutsideTx(productId, establishmentId);
            } catch (e) {
                preloadedCosts[productId] = 0;
            }
        })
    );
    console.log("✅ Custos pré-calculados:", Object.keys(preloadedCosts).length, "produtos");

    // 🚀 8. Execução Atômica com timeout estendido (60s para lotes grandes)
    console.log("🛠️ PASSO 8: Abrindo transação para baixar estoque...");
    await prisma.$transaction(async (tx) => {
        for (const productId in totalDemand) {
            const item = totalDemand[productId];
            console.log(`[BAIXA] Consumindo: ${item.name} | Quantidade: ${item.qty}`);
            await consumeProduct({
                productId: item.id,
                quantity: item.qty,
                establishmentId,
                reason: "SALE",
                reference: "CSV_IMPORT_CONSOLIDATED",
                preloadedCost: preloadedCosts[productId]
            }, tx);
        }
    }, { timeout: 60000 }); // 60 segundos para lotes grandes

    console.log("✅ SUCESSO: Importação concluída.");
    return res.json({
        success: true,
        message: 'Vendas processadas com sucesso!',
        processedItems: parsed.length,
        distinctIngredients: Object.keys(totalDemand).length
    });
});

const importManual = asyncHandler(async (req, res) => {
    const { items } = req.body; // Array de { productId, quantity }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Nenhum item informado para venda manual' });
    }

    const establishmentId = req.user.establishmentId;

    // 🔒 Bloquear se auditoria aberta
    const openAudit = await prisma.stockAudit.findFirst({
        where: { establishmentId, status: "OPEN" }
    });

    if (openAudit) {
        return res.status(400).json({
            success: false,
            message: "Existe uma auditoria em andamento. Finalize antes de lançar vendas."
        });
    }

    const productIds = items.map(i => i.productId);

    // Buscar os produtos e suas receitas do banco
    const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds }, establishmentId, isActive: true },
        include: {
            Recipe: {
                include: { items: { include: { product: true } } }
            }
        }
    });

    const productMap = new Map();
    // Atenção: como o back-end retorna um array de receitas mas a modelagem no esquema pode ser "Recipe" (um-para-um)
    // Precisamos de cuidado. Na função importCSV, é feito: recipes.find(r => r.productId === p.id).
    // Prisma model para Product -> Recipe (muitos-para-um ou um-para-um).
    // Como pedimos findMany com include Recipe, dbProducts.Recipe já estará lá (se um-para-um e se chama Recipe).
    // Na função findMany do prisma.product, às vezes o relacionamento é um para muitos, mas na linha 207 ele busca de "prisma.recipe".
    // Vamos fazer igual o passo 4 de importCSV para não errar a estrutura:
    const recipes = await prisma.recipe.findMany({
        where: { productId: { in: productIds } },
        include: { items: { include: { product: true } } },
        take: 5000
    });

    dbProducts.forEach(p => {
        const recipe = recipes.find(r => r.productId === p.id);
        productMap.set(p.id, { ...p, Recipe: recipe });
    });

    // Validar produtos não encontrados
    const errors = [];
    items.forEach(item => {
        if (!productMap.has(item.productId)) {
            errors.push({ productId: item.productId, error: 'Produto não encontrado ou inativo' });
        }
    });

    if (errors.length > 0) {
        return res.status(400).json({ 
            success: false, 
            message: "Alguns produtos não existem ou estão inativos.",
            errors 
        });
    }

    // 💣 Explosão de Ingredientes Recursiva
    const totalDemand = {};

    try {
        for (const item of items) {
            const product = productMap.get(item.productId);
            const saleQty = Number(item.quantity);

            if (isNaN(saleQty) || saleQty <= 0) continue;
            await explodeDemandRecursive(product, saleQty, totalDemand, establishmentId, true);
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }

    // 🚀 Pré-buscar custos FORA da transação
    const { getProductCostOutsideTx } = require('../services/stockMovementService');
    const preloadedCosts = {};

    await Promise.all(
        Object.keys(totalDemand).map(async (productId) => {
            try {
                preloadedCosts[productId] = await getProductCostOutsideTx(productId, establishmentId);
            } catch (e) {
                preloadedCosts[productId] = 0;
            }
        })
    );

    // 🚀 Execução Atômica
    await prisma.$transaction(async (tx) => {
        for (const productId in totalDemand) {
            const demandItem = totalDemand[productId];
            await consumeProduct({
                productId: demandItem.id,
                quantity: demandItem.qty,
                establishmentId,
                reason: "SALE",
                reference: "MANUAL_SALE",
                preloadedCost: preloadedCosts[productId]
            }, tx);
        }
    }, { timeout: 60000 });

    return res.json({
        success: true,
        message: 'Vendas lançadas com sucesso!',
        processedItems: items.length,
        distinctIngredients: Object.keys(totalDemand).length
    });
});

module.exports = { importCSV, importManual };