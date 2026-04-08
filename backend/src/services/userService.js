const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

const create = async ({ nome, email, senha, role, establishmentIds }) => {

    const allowedRoles = ['ADMIN', 'STOCK_COUNTER'];

    if (!allowedRoles.includes(role)) {
        throw new Error('Role inválido');
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    const user = await prisma.users.create({
        data: {
            nome,
            email,
            senha_hash,
            role,
            establishment: {
                connect: { id: establishmentIds[0] }
            }
        }
    });

    if (establishmentIds && establishmentIds.length > 0) {
        const relations = establishmentIds.map(establishmentId => ({
            userId: user.id,
            establishmentId,
            role
        }));

        await prisma.userEstablishment.createMany({
            data: relations
        });
    }

    return user;
};
const update = async (id, { nome, email, role }) => {
    const allowedRoles = ['ADMIN', 'STOCK_COUNTER'];

    if (role && !allowedRoles.includes(role)) {
        throw new Error('Role inválido');
    }

    const user = await prisma.users.update({
        where: { id },
        data: {
            nome,
            email,
            role
        }
    });

    return user;
};

module.exports = { create, update };

