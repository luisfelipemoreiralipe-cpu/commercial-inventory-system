const prisma = require('../config/prisma');

const BUSINESS_TIME_ZONE = 'America/Sao_Paulo';

const parseBusinessDateBoundary = (date, endOfDay = false) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error('Data inválida. Use o formato YYYY-MM-DD.');
    }

    const time = endOfDay ? '23:59:59.999' : '00:00:00.000';

    // O calendário operacional do sistema é o de São Paulo (UTC-03 desde 2019).
    return new Date(`${date}T${time}-03:00`);
};

const getBusinessDayKey = (date) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: BUSINESS_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    return `${values.year}-${values.month}-${values.day}`;
};

const getMonthlyBonusTrend = async (establishmentId, dateFrom, dateTo) => {
    const where = {
        establishmentId,
        OR: [
            { reason: 'BONUS' },
            { type: 'BONUS' }
        ]
    };

    if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59');
    } else {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // 6 meses incluindo o atual
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);
        where.createdAt = { gte: sixMonthsAgo };
    }

    const movements = await prisma.stockMovement.findMany({
        where,
        include: {
            product: true
        },
        orderBy: { createdAt: 'asc' }
    });

    const monthlyDataMap = {};
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    movements.forEach(m => {
        const date = new Date(m.createdAt);
        const year = date.getFullYear();
        const monthNum = date.getMonth();
        const key = `${year}-${monthNum}`;
        
        if (!monthlyDataMap[key]) {
            monthlyDataMap[key] = {
                month: `${months[monthNum]}/${year.toString().slice(-2)}`,
                total: 0,
                sortKey: date.getTime()
            };
        }

        // Soma totalCost ou calcula fallback via custo atual do produto
        const cost = Number(m.totalCost || (Number(m.quantity) * Number(m.product?.currentCost || m.product?.unitPrice || 0)));
        monthlyDataMap[key].total += cost;
    });

    return Object.values(monthlyDataMap).sort((a, b) => a.sortKey - b.sortKey);
};

const getFinancialSummary = async (establishmentId, dateFrom, dateTo) => {
    const where = { establishmentId };

    if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = parseBusinessDateBoundary(dateFrom);
        if (dateTo) where.createdAt.lte = parseBusinessDateBoundary(dateTo, true);
    } else {
        // Default to last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        where.createdAt = { gte: sevenDaysAgo };
    }

    const [movements, purchaseItems] = await Promise.all([
        prisma.stockMovement.findMany({
            where,
            select: {
                reason: true,
                totalCost: true,
                createdAt: true,
                purchaseClassification: true,
                product: { select: { purchaseClassification: true } }
            },
            orderBy: { createdAt: 'asc' }
        }),
        prisma.purchaseOrderItem.findMany({
            where: {
                purchaseOrder: {
                    establishmentId,
                    status: 'completed',
                    ...(where.createdAt ? { completedAt: where.createdAt } : {})
                }
            },
            select: {
                purchaseClassification: true,
                adjustedQuantity: true,
                unitPrice: true
            }
        })
    ]);

    const summary = {
        salesCogs: 0,
        internalConsumption: 0,
        operationalConsumption: 0,
        beverageOperationalConsumption: 0,
        cleaningConsumption: 0,
        disposablesConsumption: 0,
        otherOperationalConsumption: 0,
        bonuses: 0,
        losses: 0,
        purchasesByClassification: {
            CMV_BEVERAGES: 0,
            CLEANING: 0,
            DISPOSABLES: 0,
            OPERATING: 0,
            EXCLUDED: 0
        }
    };

    const dailyChart = {};

    movements.forEach(m => {
        const cost = Number(m.totalCost || 0);
        const reason = m.reason;

        const dayKey = getBusinessDayKey(m.createdAt);

        if (!dailyChart[dayKey]) {
            dailyChart[dayKey] = {
                date: dayKey,
                salesCogs: 0,
                internalConsumption: 0,
                operationalConsumption: 0,
                beverageOperationalConsumption: 0,
                cleaningConsumption: 0,
                disposablesConsumption: 0,
                otherOperationalConsumption: 0,
                bonuses: 0,
                losses: 0
            };
        }

        const classification = m.purchaseClassification || m.product?.purchaseClassification || 'EXCLUDED';

        if (reason === 'SALE' && classification === 'CMV_BEVERAGES') {
            summary.salesCogs += cost;
            dailyChart[dayKey].salesCogs += cost;
        } 
        else if (reason === 'INTERNAL_USE') {
            summary.internalConsumption += cost;
            dailyChart[dayKey].internalConsumption += cost;
        }
        else if (reason === 'OPERATIONAL_USE') {
            summary.operationalConsumption += cost;
            dailyChart[dayKey].operationalConsumption += cost;

            if (classification === 'CLEANING') {
                summary.cleaningConsumption += cost;
                dailyChart[dayKey].cleaningConsumption += cost;
            } else if (classification === 'DISPOSABLES') {
                summary.disposablesConsumption += cost;
                dailyChart[dayKey].disposablesConsumption += cost;
            } else if (classification === 'OPERATING') {
                summary.otherOperationalConsumption += cost;
                dailyChart[dayKey].otherOperationalConsumption += cost;
            }
        }
        else if (['PROMO', 'COURTESY', 'DOUBLE_DRINK', 'TASTING'].includes(reason)) {
            summary.operationalConsumption += cost;
            summary.beverageOperationalConsumption += cost;
            dailyChart[dayKey].operationalConsumption += cost;
            dailyChart[dayKey].beverageOperationalConsumption += cost;
        }
        else if (reason === 'BONUS') {
            summary.bonuses += cost;
            dailyChart[dayKey].bonuses += cost;
        }
        else if (['OPERATIONAL_LOSS', 'LOSS'].includes(reason)) {
            summary.losses += cost;
            dailyChart[dayKey].losses += cost;
        }
    });

    purchaseItems.forEach(item => {
        const classification = item.purchaseClassification || 'EXCLUDED';
        summary.purchasesByClassification[classification] +=
            Number(item.adjustedQuantity || 0) * Number(item.unitPrice || 0);
    });

    return {
        summary,
        chartData: Object.values(dailyChart).sort((a, b) => a.date.localeCompare(b.date))
    };
};

const getPurchasesByProduct = async (establishmentId, productId, dateFrom, dateTo) => {
    const where = {
        purchaseOrder: {
            establishmentId,
            status: 'completed'
        }
    };

    if (productId) {
        where.productId = productId;
    }

    if (dateFrom || dateTo) {
        where.purchaseOrder.completedAt = {};
        if (dateFrom) where.purchaseOrder.completedAt.gte = new Date(dateFrom);
        if (dateTo) where.purchaseOrder.completedAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const items = await prisma.purchaseOrderItem.findMany({
        where,
        include: {
            purchaseOrder: {
                select: {
                    id: true,
                    completedAt: true
                }
            },
            product: {
                select: { name: true, unit: true, purchaseUnit: true, packQuantity: true }
            },
            supplier: {
                select: { name: true }
            }
        },
        orderBy: {
            purchaseOrder: { completedAt: 'desc' }
        }
    });

    return items;
};

module.exports = {
    getMonthlyBonusTrend,
    getFinancialSummary,
    getPurchasesByProduct
};
