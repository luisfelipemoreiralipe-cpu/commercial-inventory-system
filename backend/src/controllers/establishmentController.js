const prisma = require('../config/prisma');
const asyncHandler = require('../utils/asyncHandler');
const { update } = require('./supplierController');

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

    const update = asyncHandler(async (req, res) => {
        console.log('🔥 UPDATE ESTABLISHMENT CONTROLLER HIT');
        const { id } = req.params;
        const { nome_fantasia } = req.body;

        // 🔍 pega o estabelecimento atual (do usuário logado)
        const currentEstablishment = await prisma.establishment.findUnique({
            where: { id: req.user.establishmentId }
        });

        if (!currentEstablishment) {
            return res.status(404).json({
                success: false,
                message: 'Establishment não encontrado'
            });
        }

        // 🔍 valida se o establishment que quer editar pertence à mesma organização
        const establishmentToUpdate = await prisma.establishment.findFirst({
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

        // ✏️ atualiza
        const updated = await prisma.establishment.update({
            where: { id },
            data: {
                nome_fantasia
            }
        });

        res.json({
            success: true,
            data: updated
        });
    });

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
    getAll,
    update
};