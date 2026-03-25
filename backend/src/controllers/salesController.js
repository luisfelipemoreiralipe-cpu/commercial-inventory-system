const asyncHandler = require('../utils/asyncHandler');
const prisma = require('../utils/prisma');
const { consumeProduct } = require('../services/stockMovementService');

const importCSV = asyncHandler(async (req, res) => {

    // 🔒 validar arquivo
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'Arquivo CSV é obrigatório'
        });
    }

    const establishmentId = req.user.establishmentId;

    // 🔒 bloquear se auditoria aberta
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

    // 📄 ler CSV
    const fileContent = req.file.buffer.toString('utf-8');

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

    console.log("PARSED:", parsed);

    // 🔍 validar produtos
    const results = [];
    const errors = [];

    for (let item of parsed) {

        const product = await prisma.product.findFirst({
            where: {
                name: item.product,
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

        results.push({
            productId: product.id,
            quantity: item.quantity
        });
    }

    // 🔒 se tiver erro, para tudo
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors
        });
    }

    // 🚀 PROCESSAMENTO USANDO consumeProduct
    await prisma.$transaction(async (tx) => {

        for (let item of results) {

            await consumeProduct({
                productId: item.productId,
                quantity: item.quantity,
                establishmentId,
                reason: "SALE",
                reference: "CSV_IMPORT"
            }, tx);

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