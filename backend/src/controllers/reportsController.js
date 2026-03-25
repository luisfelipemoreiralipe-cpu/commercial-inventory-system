const productService = require('../services/productService');
const asyncHandler = require('../utils/asyncHandler');

// ─── PURCHASE SAVINGS REPORT ───────────────────────────────────────────

const getPurchaseSavings = asyncHandler(async (req, res) => {

    const data = await productService.getPurchaseSavings(
        req.user.establishmentId
    );

    res.json({
        success: true,
        data
    });

});

const getLossByProduct = asyncHandler(async (req, res) => {

    const establishmentId = req.user.establishmentId;

    const audit = await prisma.stockAudit.findFirst({
        where: {
            establishmentId,
            status: "CLOSED"
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            items: {
                include: {
                    product: true
                }
            }
        }
    });

    if (!audit) {
        return res.json({
            success: true,
            data: []
        });
    }

    const result = {};

    for (const item of audit.items) {

        const supplierPrice = await prisma.productSupplier.findFirst({
            where: {
                productId: item.productId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const cost = Number(supplierPrice?.price || 0);
        const diff = Number(item.difference || 0);
        const loss = diff * cost;

        const productName = item.product?.name || "Sem nome";

        if (!result[productName]) {
            result[productName] = 0;
        }

        result[productName] += loss;
    }

    const formatted = Object.entries(result)
        .map(([product, loss]) => ({
            product,
            loss
        }))
        .filter(item => item.loss < 0)
        .sort((a, b) => a.loss - b.loss);

    res.json({
        success: true,
        data: formatted
    });

});

const prisma = require('../utils/prisma');

const getLoss = asyncHandler(async (req, res) => {

    const establishmentId = req.user.establishmentId;

    const audit = await prisma.stockAudit.findFirst({
        where: {
            establishmentId,
            status: "CLOSED"
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            items: {
                include: {
                    product: true
                }
            }
        }
    });

    let totalLoss = 0;

    for (const item of audit.items) {

        const supplierPrice = await prisma.productSupplier.findFirst({
            where: {
                productId: item.productId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const cost = Number(supplierPrice?.price || 0);
        const diff = Number(item.difference || 0);
        const loss = diff * cost;

        console.log({
            product: item.product?.name,
            difference: diff,
            cost,
            loss
        });

        totalLoss += loss;
    }

    res.json({
        success: true,
        totalLoss
    });

});

module.exports = {
    getPurchaseSavings,
    getLoss,
    getLossByProduct

};