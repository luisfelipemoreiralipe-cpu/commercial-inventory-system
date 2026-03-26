const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {

    const establishment = await prisma.establishment.findUnique({
        where: { id: req.user.establishmentId }
    });

    if (!establishment) {
        return res.status(404).json({
            success: false,
            message: 'Establishment não encontrado'
        });
    }

    const establishments = await prisma.establishment.findMany({
        where: {
            organizationId: establishment.organizationId
        },
        select: {
            id: true,
            nome_fantasia: true
        }
    });

    res.json({
        success: true,
        data: establishments
    });

});

module.exports = {
    getAll
};