const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');
const stockMovementService = require('./stockMovementService');

function calculateAccrual({ balanceBefore, eligibleQuantity, buyQuantity, bonusQuantity }) {
    const total = Number(balanceBefore) + Number(eligibleQuantity);
    const threshold = Number(buyQuantity);
    if (!(threshold > 0)) throw new Error('Quantidade de compra do acordo deve ser maior que zero.');
    const cycles = Math.floor((total + 1e-9) / threshold);
    return {
        earnedBonusQuantity: cycles * Number(bonusQuantity),
        balanceAfter: total - cycles * threshold
    };
}

async function listAgreements(establishmentId) {
    return prisma.commercialAgreement.findMany({
        where: { establishmentId },
        include: {
            supplier: { select: { id: true, name: true } },
            products: { include: { product: { select: { id: true, name: true, purchaseUnit: true } } } },
            accruals: { select: { earnedBonusQuantity: true } },
            receipts: { where: { status: 'RECEIVED' }, include: { items: true } }
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
    });
}

async function createAgreement(data) {
    const { establishmentId, supplierId, productIds, createdByUserId } = data;
    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, establishmentId } });
    if (!supplier) throw new AppError('Fornecedor inválido para este estabelecimento.', 400);
    if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new AppError('Selecione pelo menos um produto elegível.', 400);
    }
    const products = await prisma.product.findMany({
        where: { id: { in: productIds.map(item => item.productId) }, establishmentId, isActive: true },
        select: { id: true }
    });
    if (products.length !== new Set(productIds.map(item => item.productId)).size) {
        throw new AppError('Um ou mais produtos elegíveis são inválidos.', 400);
    }
    if (!(Number(data.buyQuantity) > 0) || !(Number(data.bonusQuantity) > 0)) {
        throw new AppError('Informe uma regra de bonificação válida.', 400);
    }

    if (!String(data.name || '').trim() || !data.startsAt || Number.isNaN(new Date(data.startsAt).getTime())) {
        throw new AppError('Informe o nome e a data inicial do acordo.', 400);
    }

    return prisma.commercialAgreement.create({
        data: {
            establishmentId,
            supplierId,
            name: String(data.name || '').trim(),
            brand: String(data.brand || '').trim() || null,
            buyQuantity: Number(data.buyQuantity),
            bonusQuantity: Number(data.bonusQuantity),
            allowMixedProducts: data.allowMixedProducts !== false,
            startsAt: new Date(data.startsAt),
            endsAt: data.endsAt ? new Date(data.endsAt) : null,
            notes: String(data.notes || '').trim() || null,
            createdByUserId,
            products: {
                create: productIds.map(item => ({
                    productId: item.productId,
                    eligibilityFactor: Number(item.eligibilityFactor || 1),
                    canGenerateBonus: item.canGenerateBonus !== false,
                    canBeReceivedAsBonus: item.canBeReceivedAsBonus !== false
                }))
            }
        },
        include: { supplier: true, products: { include: { product: true } } }
    });
}

async function processInvoiceAccruals(tx, { invoice, invoiceItems }) {
    const agreements = await tx.commercialAgreement.findMany({
        where: {
            establishmentId: invoice.establishmentId,
            supplierId: invoice.supplierId,
            status: 'ACTIVE',
            startsAt: { lte: invoice.issuedAt },
            OR: [{ endsAt: null }, { endsAt: { gte: invoice.issuedAt } }]
        },
        include: { products: true }
    });

    for (const agreement of agreements) {
        const eligibility = new Map(
            agreement.products.filter(item => item.canGenerateBonus)
                .map(item => [item.productId, Number(item.eligibilityFactor || 1)])
        );
        const eligibleQuantity = invoiceItems.reduce((sum, item) =>
            sum + (eligibility.has(item.productId)
                ? Number(item.quantity) * eligibility.get(item.productId)
                : 0), 0);
        if (eligibleQuantity <= 0) continue;

        const balanceBefore = Number(agreement.currentRemainder || 0);
        const calculated = calculateAccrual({
            balanceBefore,
            eligibleQuantity,
            buyQuantity: agreement.buyQuantity,
            bonusQuantity: agreement.bonusQuantity
        });
        await tx.bonusAccrual.create({
            data: {
                agreementId: agreement.id,
                invoiceId: invoice.id,
                eligibleQuantity,
                balanceBefore,
                earnedBonusQuantity: calculated.earnedBonusQuantity,
                balanceAfter: calculated.balanceAfter
            }
        });
        await tx.commercialAgreement.update({
            where: { id: agreement.id },
            data: { currentRemainder: calculated.balanceAfter }
        });
    }
}

async function receiveBonus({ establishmentId, userId, agreementId, invoiceNumber, invoiceSeries, invoiceDate, additionalCredits, items }) {
    if (!Array.isArray(items) || items.length === 0) throw new AppError('Informe os itens bonificados.', 400);
    if (!String(invoiceNumber || '').trim() || !invoiceDate || Number.isNaN(new Date(invoiceDate).getTime())) {
        throw new AppError('Informe o numero e a data da nota de bonificacao.', 400);
    }
    return prisma.$transaction(async tx => {
        const agreement = await tx.commercialAgreement.findFirst({
            where: { id: agreementId, establishmentId, status: 'ACTIVE' }, include: { products: true }
        });
        if (!agreement) throw new AppError('Acordo comercial ativo não encontrado.', 404);
        const eligible = new Set(agreement.products.filter(item => item.canBeReceivedAsBonus).map(item => item.productId));
        if (items.some(item => !eligible.has(item.productId))) {
            throw new AppError('A nota possui produto não autorizado como bonificação neste acordo.', 400);
        }

        const productIds = [...new Set(items.map(item => item.productId))];
        const products = await tx.product.findMany({ where: { id: { in: productIds }, establishmentId } });
        const productMap = new Map(products.map(product => [product.id, product]));
        const locations = await tx.stockLocation.findMany({
            where: { id: { in: [...new Set(items.map(item => item.locationId))] }, establishmentId }, select: { id: true }
        });
        if (products.length !== productIds.length || locations.length !== new Set(items.map(item => item.locationId)).size) {
            throw new AppError('Produto ou local inválido para este estabelecimento.', 400);
        }

        const receipt = await tx.bonusReceipt.create({
            data: {
                establishmentId,
                supplierId: agreement.supplierId,
                agreementId,
                invoiceNumber: String(invoiceNumber || '').trim(),
                invoiceSeries: String(invoiceSeries || '').trim(),
                invoiceDate: new Date(invoiceDate),
                additionalCredits: Number(additionalCredits || 0),
                createdByUserId: userId
            }
        });

        for (const item of items) {
            const product = productMap.get(item.productId);
            const quantity = Number(item.quantity);
            const fiscalUnitPrice = Number(item.fiscalUnitPrice);
            const commercialReferencePrice = Number(item.commercialReferencePrice);
            if (!(quantity > 0) || fiscalUnitPrice < 0 || !(commercialReferencePrice >= 0)) {
                throw new AppError('Quantidade e valores da bonificação são inválidos.', 400);
            }
            await tx.bonusReceiptItem.create({
                data: {
                    bonusReceiptId: receipt.id,
                    productId: item.productId,
                    locationId: item.locationId,
                    quantity,
                    fiscalUnitPrice,
                    commercialReferencePrice,
                    fiscalTotal: quantity * fiscalUnitPrice,
                    commercialBenefit: quantity * commercialReferencePrice
                }
            });
            await stockMovementService.addStock({
                productId: item.productId,
                quantity: quantity * Number(product.packQuantity || 1),
                establishmentId,
                reason: 'BONUS',
                reference: `BONUS_RECEIPT:${receipt.id}`,
                supplierId: agreement.supplierId,
                unitCost: commercialReferencePrice / Number(product.packQuantity || 1),
                locationId: item.locationId,
                updateCurrentCost: false
            }, tx);
        }
        return receipt;
    }, { maxWait: 10000, timeout: 60000 });
}

async function getSummary(establishmentId, dateFrom, dateTo) {
    const dateWhere = {};
    if (dateFrom) dateWhere.gte = new Date(`${dateFrom}T00:00:00-03:00`);
    if (dateTo) dateWhere.lte = new Date(`${dateTo}T23:59:59.999-03:00`);
    const agreements = await prisma.commercialAgreement.findMany({
        where: { establishmentId },
        include: {
            supplier: { select: { name: true } },
            accruals: { where: Object.keys(dateWhere).length ? { invoice: { issuedAt: dateWhere } } : undefined },
            receipts: {
                where: { status: 'RECEIVED', ...(Object.keys(dateWhere).length ? { invoiceDate: dateWhere } : {}) },
                include: { items: true }
            }
        }
    });
    return agreements.map(agreement => {
        const earned = agreement.accruals.reduce((sum, row) => sum + Number(row.earnedBonusQuantity), 0);
        const received = agreement.receipts.flatMap(row => row.items).reduce((sum, row) => sum + Number(row.quantity), 0);
        const fiscalValue = agreement.receipts.flatMap(row => row.items).reduce((sum, row) => sum + Number(row.fiscalTotal), 0);
        const commercialBenefit = agreement.receipts.flatMap(row => row.items).reduce((sum, row) => sum + Number(row.commercialBenefit), 0);
        const credits = agreement.receipts.reduce((sum, row) => sum + Number(row.additionalCredits), 0);
        return {
            agreementId: agreement.id,
            name: agreement.name,
            brand: agreement.brand,
            supplierName: agreement.supplier.name,
            earnedBonusQuantity: earned,
            receivedBonusQuantity: received,
            pendingBonusQuantity: earned - received,
            fiscalValue,
            commercialBenefit,
            additionalCredits: credits,
            totalBenefit: commercialBenefit + credits,
            currentRemainder: Number(agreement.currentRemainder)
        };
    });
}

module.exports = { calculateAccrual, listAgreements, createAgreement, processInvoiceAccruals, receiveBonus, getSummary };
