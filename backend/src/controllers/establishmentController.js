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

const create = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const userId = req.user.userId;
    const currentEstablishmentId = req.user.establishmentId;

    if (!name) {
        return res.status(400).json({ success: false, message: 'Nome é obrigatório' });
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Pega o estabelecimento atual
        let currentEst = await tx.establishments.findUnique({
            where: { id: currentEstablishmentId }
        });

        if (!currentEst) {
            throw new Error('Estabelecimento atual não encontrado');
        }

        // 2. Garante que exista uma Organização vinculada (Upgrade para Rede)
        let orgId = currentEst.organizationId;
        if (!orgId) {
            const newOrg = await tx.organization.create({
                data: { name: `Rede ${currentEst.name}` }
            });
            orgId = newOrg.id;

            // Atualiza o atual para pertencer a essa nova Org
            await tx.establishments.update({
                where: { id: currentEstablishmentId },
                data: { organizationId: orgId }
            });
        }

        // 3. Cria a nova unidade
        const newEstablishment = await tx.establishments.create({
            data: { 
                name,
                organizationId: orgId
            }
        });

        // 4. Criar Categorias Padrão (Seed)
        const defaultCategories = [
            'Bebidas', 'Alimentos', 'Proteínas', 'Hortifruti', 
            'Embalagens', 'Limpeza', 'Outros'
        ];

        await tx.category.createMany({
            data: defaultCategories.map(cat => ({
                name: cat,
                establishmentId: newEstablishment.id
            }))
        });

        // 5. Vincula TODOS os usuários da organização ao novo estabelecimento
        const orgEstablishments = await tx.establishments.findMany({
            where: { organizationId: orgId },
            select: { id: true }
        });

        const orgEstIds = orgEstablishments.map(e => e.id).filter(id => id !== newEstablishment.id);

        const existingUsers = await tx.userEstablishment.findMany({
            where: { establishmentId: { in: orgEstIds } },
            select: { userId: true, role: true },
            distinct: ['userId']
        });

        if (existingUsers.length > 0) {
            await tx.userEstablishment.createMany({
                data: existingUsers.map(ue => ({
                    userId: ue.userId,
                    establishmentId: newEstablishment.id,
                    role: ue.role
                })),
                skipDuplicates: true
            });
        }

        return newEstablishment;
    });

    res.status(201).json({ success: true, data: result });
});

module.exports = {
    getAll,
    update,
    create
};