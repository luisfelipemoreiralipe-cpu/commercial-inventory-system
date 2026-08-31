require('dotenv').config();

const prisma = require('../src/utils/prisma');
const apply = process.argv.includes('--apply');
const ORGANIZATION_ID = '41b034b1-fe5a-47bc-910f-c09f49a02149';
const COMMERCIAL_ID = 'e3dd7833-6cf6-4020-b712-4d5c788bff0c';

const normalize = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ');

const validCnpj = value => {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length === 14 && !/^(\d)\1+$/.test(digits) ? digits : null;
};

const aliases = new Map([
    ['FENSA', 'FEMSA'],
    ['MT', 'MT DISTRIBUIDORA'],
    ['PAK NETO', 'PAK NETO'],
    ['SANGUINE', 'SANGUINE'],
    ['WEBER', 'CACHAÇARIA WEBER']
]);

async function run() {
    const [commercialSuppliers, allUnlinked, centralSuppliers, admin] = await Promise.all([
        prisma.supplier.findMany({ where: { establishmentId: COMMERCIAL_ID }, orderBy: { name: 'asc' } }),
        prisma.supplier.findMany({ where: { establishment: { organizationId: ORGANIZATION_ID }, organizationSupplierId: null }, include: { establishment: { select: { name: true } } } }),
        prisma.organizationSupplier.findMany({ where: { organizationId: ORGANIZATION_ID, isActive: true } }),
        prisma.userEstablishment.findFirst({ where: { establishmentId: COMMERCIAL_ID, role: 'ADMIN', isActive: true }, select: { userId: true } })
    ]);
    if (!admin) throw new Error('commercial nao possui ADMIN ativo para auditoria.');

    const centralByName = new Map(centralSuppliers.map(item => [normalize(item.name), item]));
    const plan = [];
    const handled = new Set();

    for (const supplier of commercialSuppliers.filter(item => !item.organizationSupplierId)) {
        if (handled.has(supplier.id)) continue;
        const localName = normalize(supplier.name);
        const centralName = aliases.get(localName);
        if (centralName) {
            const central = centralByName.get(normalize(centralName));
            if (!central) throw new Error(`Fornecedor central ${centralName} nao encontrado.`);
            plan.push({ action: 'LINK_EXISTING', centralId: central.id, centralName: central.name, supplierIds: [supplier.id], localSuppliers: [`commercial: ${supplier.name}`] });
            handled.add(supplier.id);
            continue;
        }

        const sameName = allUnlinked.filter(item => normalize(item.name) === localName);
        sameName.forEach(item => handled.add(item.id));
        plan.push({
            action: 'CREATE_AND_LINK',
            centralName: supplier.name.trim(),
            cnpj: validCnpj(supplier.cnpj),
            supplierIds: sameName.map(item => item.id),
            localSuppliers: sameName.map(item => `${item.establishment.name}: ${item.name}`)
        });
    }

    if (apply) {
        await prisma.$transaction(async tx => {
            for (const item of plan) {
                let centralId = item.centralId;
                if (item.action === 'CREATE_AND_LINK') {
                    const central = await tx.organizationSupplier.create({ data: { organizationId: ORGANIZATION_ID, name: item.centralName, cnpj: item.cnpj, isActive: true } });
                    centralId = central.id;
                }
                const result = await tx.supplier.updateMany({ where: { id: { in: item.supplierIds }, organizationSupplierId: null, establishment: { organizationId: ORGANIZATION_ID } }, data: { organizationSupplierId: centralId } });
                if (result.count !== item.supplierIds.length) throw new Error(`Consolidacao concorrente detectada em ${item.centralName}.`);
                await tx.auditLog.create({ data: { actionType: 'CONSOLIDATE', entityType: 'ORGANIZATION_SUPPLIER', entityId: centralId, description: `${item.supplierIds.length} fornecedor(es) vinculado(s) automaticamente por ${admin.userId}.`, establishmentId: COMMERCIAL_ID } });
                item.organizationSupplierId = centralId;
            }
        }, { maxWait: 15000, timeout: 60000 });
    }

    console.log(JSON.stringify({ mode: apply ? 'apply' : 'preview', suppliers: plan.length, links: plan.reduce((total, item) => total + item.supplierIds.length, 0), plan }, null, 2));
}

run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
