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
    getLoss
};