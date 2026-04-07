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

module.exports = {
    getMonthlyBonusTrend
};
