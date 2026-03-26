const prisma = require('../config/prisma');

async function getDashboard(req, res) {
    try {
        const totalProducts = await prisma.product.count({
            where: {
                establishmentId: req.user.establishmentId
            }
        });

        return res.status(200).json({
            totalProducts
        });

    } catch (error) {
        console.error('ERRO DASHBOARD:', error);
        return res.status(500).json({
            error: error.message
        });
    }
}

module.exports = {
    getDashboard
};