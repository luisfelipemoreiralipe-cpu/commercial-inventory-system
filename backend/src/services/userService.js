const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

const create = async ({ name, email, password, role, establishmentIds }) => {

    const allowedRoles = ['ADMIN', 'MANAGER', 'STAFF', 'STOCK_COUNTER'];

    if (!allowedRoles.includes(role)) {
        throw new Error('Role inválido');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
        data: {
            name,
            email,
            password: hashedPassword
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
const update = async (id, { name, email, role, establishmentId }) => {
    return await prisma.$transaction(async (tx) => {
        const user = await tx.users.update({
            where: { id },
            data: {
                name,
                email
            }
        });

        if (role && establishmentId) {
            await tx.userEstablishment.update({
                where: {
                    userId_establishmentId: {
                        userId: id,
                        establishmentId
                    }
                },
                data: { role }
            });
        }

        return user;
    });
};

module.exports = { create, update };

