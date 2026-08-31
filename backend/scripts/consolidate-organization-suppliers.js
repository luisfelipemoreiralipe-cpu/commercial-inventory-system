const prisma = require('../src/utils/prisma');
const service = require('../src/services/organizationSupplierService');

const apply = process.argv.includes('--apply');

async function run() {
    const organizations = await prisma.organization.findMany({
        include: {
            establishments: {
                include: {
                    suppliers: {
                        where: { organizationSupplierId: null },
                        select: { id: true, name: true, cnpj: true, establishmentId: true }
                    },
                    users: {
                        where: { role: 'ADMIN', isActive: true },
                        select: { userId: true },
                        take: 1
                    }
                }
            }
        }
    });

    const results = [];
    for (const organization of organizations) {
        const candidates = service.buildCandidateGroups(
            organization.establishments.flatMap(item => item.suppliers)
        );
        const adminEstablishment = organization.establishments.find(item => item.users.length);
        if (apply && candidates.length && !adminEstablishment) {
            throw new Error(`Organização ${organization.name} não possui ADMIN ativo para auditoria.`);
        }

        for (const candidate of candidates) {
            const canonicalName = candidate.suppliers
                .map(item => item.name.trim())
                .sort((a, b) => b.length - a.length || a.localeCompare(b, 'pt-BR'))[0];
            const preview = {
                organization: organization.name,
                cnpj: candidate.normalizedCnpj,
                name: canonicalName,
                supplierIds: candidate.suppliers.map(item => item.id),
                localNames: candidate.suppliers.map(item => item.name),
                applied: false
            };

            if (apply) {
                const response = await service.approveCandidate({
                    candidateKey: candidate.candidateKey,
                    supplierIds: preview.supplierIds,
                    name: canonicalName,
                    legalName: null
                }, adminEstablishment.id, adminEstablishment.users[0].userId);
                preview.applied = true;
                preview.idempotent = response.idempotent;
                preview.organizationSupplierId = response.organizationSupplier.id;
            }
            results.push(preview);
        }
    }

    console.log(JSON.stringify({ mode: apply ? 'apply' : 'preview', groups: results.length, results }, null, 2));
}

run()
    .catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
