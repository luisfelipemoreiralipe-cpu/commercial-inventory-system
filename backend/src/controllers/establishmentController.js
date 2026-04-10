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

        // 5. Dá acesso administrativo ao usuário criador na nova unidade
        await tx.userEstablishment.create({
            data: {
                userId,
                establishmentId: newEstablishment.id,
                role: 'ADMIN' // Quem cria é Admin por padrão
            }
        });

        return newEstablishment;
    });

    res.status(201).json({ success: true, data: result });
});

module.exports = {
    getAll,
    update,
    create
};