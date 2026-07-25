const prisma = require('../config/prisma');

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
        if (dateFrom) where.createdAt.gte = new Date(dateFrom);
        if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
    } else {
        // Default to last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        where.createdAt = { gte: sevenDaysAgo };
    }

    const movements = await prisma.stockMovement.findMany({
        where,
        select: {
            reason: true,
            totalCost: true,
            createdAt: true
        },
        orderBy: { createdAt: 'asc' }
    });

    const summary = {
        salesCogs: 0,
        internalConsumption: 0,
        bonuses: 0,
        losses: 0,
    };

    const dailyChart = {};

    movements.forEach(m => {
        const cost = Number(m.totalCost || 0);
        const reason = m.reason;

        const date = new Date(m.createdAt);
        const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!dailyChart[dayKey]) {
            dailyChart[dayKey] = {
                date: dayKey,
                salesCogs: 0,
                internalConsumption: 0,
                bonuses: 0,
                losses: 0
            };
        }

        if (reason === 'SALE') {
            summary.salesCogs += cost;
            dailyChart[dayKey].salesCogs += cost;
        } 
        else if (['INTERNAL_USE', 'PROMO', 'COURTESY', 'DOUBLE_DRINK', 'TASTING'].includes(reason)) {
            summary.internalConsumption += cost;
            dailyChart[dayKey].internalConsumption += cost;
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

    return {
        summary,
        chartData: Object.values(dailyChart)
    };
};

module.exports = {
    getMonthlyBonusTrend,
    getFinancialSummary
};
