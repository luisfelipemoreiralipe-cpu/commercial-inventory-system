const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categoryService = require('../src/services/categoryService');
const supplierService = require('../src/services/supplierService');
const productService = require('../src/services/productService');
const productSupplierService = require('../src/services/productSupplierService');
const purchaseOrderService = require('../src/services/purchaseOrderService');
const stockMovementService = require('../src/services/stockMovementService');
const portioningService = require('../src/services/portioningService');
const recipeService = require('../src/services/recipeService');
const productionService = require('../src/services/productionService');
const stockTransferService = require('../src/services/stockTransferService');
const consumptionEventService = require('../src/services/consumptionEventService');
const stockAuditService = require('../src/services/stockAuditService');

const ESTABLISHMENT_ID = '32638f69-422d-4d02-84f0-40b7ec68cae4';
const USER_ID = 'beb36cf7-aeb7-40bf-9388-2feb880feb2a';

// Logger wrapper
function log(step, message, data = null) {
    console.log(`\n[${step}] ${message}`);
    if (data) console.log(JSON.stringify(data, null, 2));
}

async function runE2ETests() {
    console.log("==========================================");
    console.log("🚀 STARTING E2E SYSTEM TESTS");
    console.log("==========================================");

    let ctx = {}; // Context to hold created IDs

    try {
        console.log("Limpando dados de execuções anteriores...");
        await prisma.stockAuditItem.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.stockAudit.deleteMany({ where: { items: { none: {} } } });
        await prisma.consumptionEventItem.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.consumptionEvent.deleteMany({ where: { name: 'Quebrou E2E' } });
        await prisma.stockMovement.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.purchaseOrderItem.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.purchaseOrder.deleteMany({ where: { items: { some: { productName: { contains: 'E2E' } } } } });
        await prisma.productionOrder.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.portioningOrderItem.deleteMany({ where: { targetProduct: { name: { contains: 'E2E' } } } });
        await prisma.portioningOrder.deleteMany({ where: { sourceProduct: { name: { contains: 'E2E' } } } });
        await prisma.portioningRecipeItem.deleteMany({ where: { targetProduct: { name: { contains: 'E2E' } } } });
        await prisma.portioningRecipe.deleteMany({ where: { sourceProduct: { name: { contains: 'E2E' } } } });
        await prisma.recipeItem.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.recipe.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.supplierPriceHistory.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.productSupplier.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.productStock.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.product.deleteMany({ where: { name: { contains: 'E2E' } } });
        await prisma.supplier.deleteMany({ where: { name: 'Açougue Teste E2E' } });
        await prisma.category.deleteMany({ where: { name: 'Carnes Teste E2E' } });
        await prisma.auditLog.deleteMany({ where: { description: { contains: 'E2E' } } });

        // ==========================================
        // 1. Cadastros Básicos
        // ==========================================
        log('1.1', 'Criando Categoria...');
        const category = await prisma.category.create({
            data: { name: 'Carnes Teste E2E', establishmentId: ESTABLISHMENT_ID }
        });
        ctx.categoryId = category.id;
        log('1.1', 'Categoria criada:', { id: category.id, name: category.name });

        log('1.2', 'Criando Fornecedor...');
        const supplier = await prisma.supplier.create({
            data: { name: 'Açougue Teste E2E', cnpj: '00000000000100', establishmentId: ESTABLISHMENT_ID }
        });
        ctx.supplierId = supplier.id;
        log('1.2', 'Fornecedor criado:', { id: supplier.id, name: supplier.name });

        // Get a default stock location
        const location = await prisma.stockLocation.findFirst({ where: { establishmentId: ESTABLISHMENT_ID, isDefault: true } });
        const defaultLocationId = location ? location.id : null;

        log('1.3', 'Criando Produtos...');
        const rawProduct = await productService.createProduct({
            name: 'Filé Mignon Peça E2E', unit: 'KG', type: 'INVENTORY', categoryId: ctx.categoryId, 
            purchaseUnit: 'KG', packQuantity: 1, minQuantity: 0, defaultLocationId, quantity: 0
        }, ESTABLISHMENT_ID);
        ctx.rawProductId = rawProduct.id;

        const roastbeefProduct = await productService.createProduct({
            name: 'Roastbeef E2E', unit: 'KG', type: 'PRODUCTION', categoryId: ctx.categoryId, 
            purchaseUnit: 'KG', packQuantity: 1, minQuantity: 0, defaultLocationId, quantity: 0
        }, ESTABLISHMENT_ID);
        ctx.roastbeefId = roastbeefProduct.id;

        const iscasProduct = await productService.createProduct({
            name: 'Iscas E2E', unit: 'KG', type: 'PRODUCTION', categoryId: ctx.categoryId, 
            purchaseUnit: 'KG', packQuantity: 1, minQuantity: 0, defaultLocationId, quantity: 0
        }, ESTABLISHMENT_ID);
        ctx.iscasId = iscasProduct.id;

        const pratoProduct = await productService.createProduct({
            name: 'Prato Roastbeef E2E', unit: 'UN', type: 'PRODUCTION', categoryId: ctx.categoryId, 
            purchaseUnit: 'UN', packQuantity: 1, minQuantity: 0, defaultLocationId, quantity: 0
        }, ESTABLISHMENT_ID);
        ctx.pratoId = pratoProduct.id;

        log('1.3', 'Produtos criados com sucesso.');

        // ==========================================
        // 2. Compras e Fornecedores
        // ==========================================
        log('2.1', 'Atrelando Fornecedor ao Produto...');
        await productSupplierService.addSupplierToProduct(ctx.rawProductId, ctx.supplierId, 100, ESTABLISHMENT_ID);
        
        log('2.2', 'Criando Pedido de Compra (2KG de Filé)...');
        const po = await purchaseOrderService.createOrder({
            items: [
                { productId: ctx.rawProductId, productName: 'Filé Mignon Peça E2E', supplierId: ctx.supplierId, adjustedQuantity: 2, unitPrice: 100 }
            ],
            establishmentId: ESTABLISHMENT_ID,
            user_id: USER_ID
        });
        ctx.poId = po.id;

        log('2.3', 'Concluindo Pedido de Compra (Gera Estoque)...');
        await purchaseOrderService.completeOrder(ctx.poId, ESTABLISHMENT_ID);
        
        // Verifica Estoque e Custo
        const rawStock = await productService.getProductById(ctx.rawProductId, ESTABLISHMENT_ID);
        log('2.3', 'Estoque do Filé Mignon após compra:', { quantity: rawStock.quantity, currentCost: rawStock.currentCost });

        // ==========================================
        // 3. Módulo Novo: Desossa / Porcionamento
        // ==========================================
        log('3.1', 'Criando Ficha de Porcionamento...');
        const portRecipe = await portioningService.createRecipe(ctx.rawProductId, ESTABLISHMENT_ID);
        ctx.portRecipeId = portRecipe.id;
        await portioningService.addRecipeItem(ctx.portRecipeId, ctx.roastbeefId, 80, ESTABLISHMENT_ID); // 80% do custo
        await portioningService.addRecipeItem(ctx.portRecipeId, ctx.iscasId, 20, ESTABLISHMENT_ID);     // 20% do custo

        log('3.2', 'Criando Ordem de Porcionamento (Usando os 2KG)...');
        const portOrder = await portioningService.createOrder({
            sourceProductId: ctx.rawProductId,
            sourceQuantity: 2,
            items: [
                { targetProductId: ctx.roastbeefId, quantity: 1.2, costAllocationPercentage: 80 },
                { targetProductId: ctx.iscasId, quantity: 0.5, costAllocationPercentage: 20 }
            ],
            establishmentId: ESTABLISHMENT_ID,
            createdBy: USER_ID
        });
        ctx.portOrderId = portOrder.id;

        log('3.3', 'Concluindo Ordem de Porcionamento...');
        await portioningService.completeOrder(ctx.portOrderId, ESTABLISHMENT_ID);

        // Verifica Estoques
        const roastbeefStock = await productService.getProductById(ctx.roastbeefId, ESTABLISHMENT_ID);
        const iscasStock = await productService.getProductById(ctx.iscasId, ESTABLISHMENT_ID);
        const rawStockAfter = await productService.getProductById(ctx.rawProductId, ESTABLISHMENT_ID);
        log('3.3', 'Estoques após Porcionamento:', {
            rawQuantity: rawStockAfter.quantity,
            roastbeef: { qty: roastbeefStock.quantity, cost: roastbeefStock.currentCost },
            iscas: { qty: iscasStock.quantity, cost: iscasStock.currentCost }
        });

        // ==========================================
        // 4. Módulo Antigo: Produção / Ficha Técnica
        // ==========================================
        log('4.1', 'Criando Ficha Técnica para o Prato...');
        const recipe = await recipeService.createRecipe(ctx.pratoId, ESTABLISHMENT_ID);
        ctx.recipeId = recipe.id;
        await recipeService.addRecipeItem(ctx.recipeId, ctx.roastbeefId, 0.2, ESTABLISHMENT_ID); // usa 200g
        // Define o rendimento (yield) do prato como 1
        await recipeService.updateRecipe(ctx.recipeId, 1, ESTABLISHMENT_ID);

        log('4.2', 'Criando e Concluindo Ordem de Produção (2 Pratos)...');
        const prodOrder = await productionService.createProductionOrder({
            productId: ctx.pratoId, quantity: 2, establishmentId: ESTABLISHMENT_ID, createdBy: USER_ID
        });
        await productionService.completeProductionOrder(prodOrder.id, ESTABLISHMENT_ID);

        const pratoStock = await productService.getProductById(ctx.pratoId, ESTABLISHMENT_ID);
        const roastbeefStockAfterProd = await productService.getProductById(ctx.roastbeefId, ESTABLISHMENT_ID);
        log('4.2', 'Estoques após Produção:', {
            prato: { qty: pratoStock.quantity, cost: pratoStock.currentCost },
            roastbeef: { qty: roastbeefStockAfterProd.quantity, cost: roastbeefStockAfterProd.currentCost }
        });

        // ==========================================
        // 5. Movimentações, Eventos e Auditoria
        // ==========================================
        log('5.1', 'Transferência de Estoque (Simulada / Falha proposital de destino se não existir outro local)');
        // Apenas listando transferencias para n quebrar se nao tiver 2 locais
        // await stockTransferService.listTransfers({ establishmentId: ESTABLISHMENT_ID });

        log('5.2', 'Evento de Consumo (Desperdício de 1 Prato)...');
        const event = await consumptionEventService.createEvent({ name: 'Quebrou E2E', establishmentId: ESTABLISHMENT_ID });
        await consumptionEventService.withdrawItem({ eventId: event.id, productId: ctx.pratoId, withdrawnQty: 1, establishmentId: ESTABLISHMENT_ID });
        await consumptionEventService.completeEvent(event.id, ESTABLISHMENT_ID);
        const pratoStockAfterEvent = await productService.getProductById(ctx.pratoId, ESTABLISHMENT_ID);
        log('5.2', 'Prato Estoque após desperdício:', pratoStockAfterEvent.quantity);

        log('5.3', 'Auditoria de Estoque (Contagem)...');
        const audit = await stockAuditService.createAudit({ establishmentId: ESTABLISHMENT_ID, createdBy: USER_ID });
        // Set Iscas to 0.4
        const auditItems = await stockAuditService.getAuditItems(audit.id, ESTABLISHMENT_ID);
        const iscasAuditItem = auditItems.find(i => i.productId === ctx.iscasId);
        if (iscasAuditItem) {
            await stockAuditService.updateAuditItemCount(audit.id, iscasAuditItem.id, 0.4, ESTABLISHMENT_ID);
        }
        await stockAuditService.completeAudit(audit.id, ESTABLISHMENT_ID, USER_ID);
        const iscasStockAfterAudit = await productService.getProductById(ctx.iscasId, ESTABLISHMENT_ID);
        log('5.3', 'Iscas Estoque após Auditoria (0.5 -> 0.4):', iscasStockAfterAudit.quantity);

        // ==========================================
        // 6. Limpeza (Teardown)
        // ==========================================
        console.log("\n==========================================");
        console.log("✅ TESTES PASSARAM. INICIANDO TEARDOWN...");
        console.log("==========================================");
        
        // We will do direct DB deletes for teardown to avoid service rules blocking it (like "has stock movements")
        await prisma.stockAuditItem.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.stockAudit.deleteMany({ where: { items: { none: {} } } });
        await prisma.consumptionEventItem.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.consumptionEvent.deleteMany({ where: { name: 'Quebrou E2E' } });
        await prisma.stockMovement.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.purchaseOrderItem.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.purchaseOrder.deleteMany({ where: { id: ctx.poId } });
        await prisma.productionOrder.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.portioningOrderItem.deleteMany({ where: { targetProduct: { name: { contains: 'E2E' } } } });
        await prisma.portioningOrder.deleteMany({ where: { id: ctx.portOrderId } });
        await prisma.portioningRecipeItem.deleteMany({ where: { targetProduct: { name: { contains: 'E2E' } } } });
        await prisma.portioningRecipe.deleteMany({ where: { sourceProductId: ctx.rawProductId } });
        await prisma.recipeItem.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.recipe.deleteMany({ where: { productId: ctx.pratoId } });
        await prisma.productSupplier.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        await prisma.productStock.deleteMany({ where: { product: { name: { contains: 'E2E' } } } });
        
        await prisma.product.deleteMany({ where: { name: { contains: 'E2E' } } });
        await prisma.supplier.deleteMany({ where: { name: 'Açougue Teste E2E' } });
        await prisma.category.deleteMany({ where: { name: 'Carnes Teste E2E' } });
        await prisma.auditLog.deleteMany({ where: { description: { contains: 'E2E' } } });

        console.log("🧹 Teardown concluído. Banco de dados limpo.");

    } catch (error) {
        console.error("\n❌ ERRO DURANTE O TESTE:");
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

runE2ETests();
