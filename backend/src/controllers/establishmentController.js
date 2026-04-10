const prisma = require('../utils/prisma');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {

    const establishment = await prisma.establishments.findUnique({
        where: { id: req.user.establishmentId }
    });

    if (!establishment) {
        return res.status(404).json({
            success: false,
            message: 'Estabelecimento não encontrado'
        });
    }

    const organizationsEstablishments = await prisma.establishments.findMany({
        where: {
            organizationId: establishment.organizationId
        },
        select: {
            id: true,
            name: true
        }
    });

    res.json({
        success: true,
        data: organizationsEstablishments
    });

});

const update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    const currentEstablishment = await prisma.establishments.findUnique({
        where: { id: req.user.establishmentId }
    });

    if (!currentEstablishment) {
        return res.status(404).json({
            success: false,
            message: 'Estabelecimento logado não encontrado'
        });
    }

    const establishmentToUpdate = await prisma.establishments.findFirst({
        where: {
            id,
            organizationId: currentEstablishment.organizationId
        }
    });

    if (!establishmentToUpdate) {
        return res.status(403).json({
            success: false,
            message: 'Você não tem permissão para editar este estabelecimento'
        });
    }

    const updated = await prisma.establishments.update({
        where: { id },
        data: {
            name
        }
    });

    res.json({
        success: true,
        data: updated
    });
});

module.exports = {
    getAll,
    update
};