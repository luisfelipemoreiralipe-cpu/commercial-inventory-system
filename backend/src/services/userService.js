const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

const create = async ({ name, email, password, role, establishmentIds }) => {

    const allowedRoles = ['ADMIN', 'MANAGER', 'STAFF', 'STOCK_COUNTER'];

    if (!allowedRoles.includes(role)) {
        throw new Error('Role inválido');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {

        const newUser = await tx.users.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        });

        // Descobre todos os estabelecimentos da mesma organização
        let allEstablishmentIds = establishmentIds || [];

        if (allEstablishmentIds.length > 0) {
            const sourceEst = await tx.establishments.findUnique({
                where: { id: allEstablishmentIds[0] }
            });

            if (sourceEst && sourceEst.organizationId) {
                const orgEstablishments = await tx.establishments.findMany({
                    where: { organizationId: sourceEst.organizationId },
                    select: { id: true }
                });
                allEstablishmentIds = orgEstablishments.map(e => e.id);
            }
        }

        if (allEstablishmentIds.length > 0) {
            await tx.userEstablishment.createMany({
                data: allEstablishmentIds.map(establishmentId => ({
                    userId: newUser.id,
                    establishmentId,
                    role
                })),
                skipDuplicates: true
            });
        }

        return newUser;
    });

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

