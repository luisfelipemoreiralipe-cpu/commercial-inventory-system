const prisma = require('../src/utils/prisma');

const normalizeCnpj = value => {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length === 14 ? digits : null;
};

async function inventory() {
    const organizations = await prisma.organization.findMany({
        include: {
            establishments: {
                include: {
                    suppliers: {
                        select: {
                            id: true,
                            name: true,
                            cnpj: true,
                            organizationSupplierId: true
                        },
                        orderBy: { name: 'asc' }
                    }
                },
                orderBy: { name: 'asc' }
            }
        },
        orderBy: { name: 'asc' }
    });

    const result = organizations.map(organization => {
        const suppliers = organization.establishments.flatMap(establishment =>
            establishment.suppliers.map(supplier => ({
                ...supplier,
                establishmentId: establishment.id,
                establishmentName: establishment.name,
                normalizedCnpj: normalizeCnpj(supplier.cnpj)
            }))
        );
        const groups = new Map();
        suppliers.forEach(supplier => {
            if (!supplier.normalizedCnpj || supplier.organizationSupplierId) return;
            groups.set(supplier.normalizedCnpj, [...(groups.get(supplier.normalizedCnpj) || []), supplier]);
        });
        const candidates = [...groups.entries()]
            .filter(([, items]) => new Set(items.map(item => item.establishmentId)).size > 1)
            .map(([cnpj, items]) => ({
                cnpj,
                establishments: new Set(items.map(item => item.establishmentId)).size,
                suppliers: items.map(item => ({
                    id: item.id,
                    name: item.name,
                    establishmentId: item.establishmentId,
                    establishmentName: item.establishmentName,
                    storedCnpj: item.cnpj
                }))
            }));

        return {
            organizationId: organization.id,
            organizationName: organization.name,
            establishments: organization.establishments.map(item => ({
                id: item.id,
                name: item.name,
                suppliers: item.suppliers.length
            })),
            summary: {
                suppliers: suppliers.length,
                linked: suppliers.filter(item => item.organizationSupplierId).length,
                validCnpj: suppliers.filter(item => item.normalizedCnpj).length,
                missingOrInvalidCnpj: suppliers.filter(item => !item.normalizedCnpj).length,
                candidateGroups: candidates.length
            },
            candidates
        };
    });

    console.log(JSON.stringify(result, null, 2));
}

inventory()
    .catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
