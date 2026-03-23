const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../utils/prisma');

const importCSV = asyncHandler(async (req, res) => {

    // 🔒 valida arquivo
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Arquivo CSV é obrigatório'
        });
    }

    const establishmentId = req.user.establishmentId;
    const openAudit = await prisma.stockAudit.findFirst({
        where: {
            establishmentId,
            status: "OPEN"
        }
    });

    if (openAudit) {
        return res.status(400).json({
            success: false,
            message: "Existe uma auditoria em andamento. Finalize antes de importar vendas."
        });
    }

    // 📄 ler conteúdo
    const fileContent = req.file.buffer.toString('utf-8');

    console.log("CSV RECEBIDO:");
    console.log(fileContent);

    // 🔥 PARSE DO CSV
    const lines = fileContent.split('\n');
    const dataLines = lines.slice(1);

    const parsed = [];

    for (let line of dataLines) {
        if (!line.trim()) continue;

        const [product, quantity] = line.split(',');

        parsed.push({
            product: product.trim().toUpperCase(),
            quantity: Number(quantity)
        });
    }

    console.log("PARSED:");
    console.log(parsed);

    // 🔍 VALIDAÇÃO
    const results = [];
    const errors = [];

    for (let item of parsed) {

        const product = await prisma.product.findFirst({
            where: {
                name: {
                    equals: item.product,
                    mode: 'insensitive'
                },
                establishmentId
            }
        });

        if (!product) {
            errors.push({
                product: item.product,
                error: 'Produto não encontrado'
            });
            continue;
        }

        // 🔥 VALIDAÇÃO DE ESTOQUE
        if (Number(product.quantity) < item.quantity) {
            errors.push({
                product: product.name,
                error: `Estoque insuficiente (Atual: ${product.quantity}, Solicitado: ${item.quantity})`
            });
            continue;
        }

        results.push({
            productId: product.id,
            name: product.name,
            quantity: item.quantity,
            currentStock: product.quantity
        });
    }

    // 🔒 NÃO PROCESSA SE HOUVER ERRO
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors
        });
    }

    // 🚀 PROCESSAMENTO (SALE REAL)
    await prisma.$transaction(async (tx) => {

        for (let item of results) {

            const product = await tx.product.findUnique({
                where: { id: item.productId }
            });

            const newQuantity = Number(product.quantity) - item.quantity;

            // 🔥 UPDATE
            await tx.product.update({
                where: { id: product.id },
                data: {
                    quantity: newQuantity
                }
            });

            // 🔥 MOVEMENT
            await tx.stockMovement.create({
                data: {
                    productId: product.id,
                    productName: product.name,
                    type: 'SALE',
                    quantity: item.quantity,
                    previousQuantity: product.quantity,
                    newQuantity: newQuantity,
                    reference: 'CSV_IMPORT',
                    reason: 'Venda via importação CSV'
                }
            });
        }

    });

    return res.json({
        success: true,
        message: 'Vendas processadas com sucesso',
        processed: results.length
    });

});

module.exports = {
    importCSV
};