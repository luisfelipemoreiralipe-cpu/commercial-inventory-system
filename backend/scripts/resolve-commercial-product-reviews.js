require('dotenv').config();

const prisma = require('../src/utils/prisma');
const apply = process.argv.includes('--apply');
const ORGANIZATION_ID = '41b034b1-fe5a-47bc-910f-c09f49a02149';
const COMMERCIAL_ID = 'e3dd7833-6cf6-4020-b712-4d5c788bff0c';

const links = [
    ['03cc6ffc-c9c6-4ce3-a8f7-29f480990011', 'abcafb32-d4f5-4870-a7fd-28a60505ddb2', 'VODKA SMIRNOFF'],
    ['fc5b8f05-cf0b-4f0d-bd53-e194152c7bb0', '2aed9bc6-892a-4a98-9773-fb61f1a268bf', 'RED BULL TRADICIONAL'],
    ['bcfe0d82-3e31-4788-bff3-b773626ce6a6', 'f0532dd4-fd3c-49e4-bbec-365e8481a8fd', 'VODKA ABSOLUT'],
    ['9ce6b9c6-a8ef-43b3-a2df-c81b8eddb33d', '97be82ab-bb8a-4feb-bd17-627d0f3b75c7', 'AGUA DE COCO'],
    ['db8d47df-f3a0-48d4-a250-672cb3ba8c08', '03461aaa-cd28-46f6-98a2-1828954c707b', 'TEQUILA JOSE CUERVO PRATA'],
    ['d4cd72ef-626a-4e78-bad8-d109202e1e01', '0b04eda7-2db0-4876-a49a-41e4359aaee7', 'BANANINHA'],
    ['07a0e522-e678-4bce-acfb-cbd2ed6b6e33', '4cdecc51-5302-4651-b274-98bb895e82bd', 'CHANDON BRUT'],
    ['55848a2f-96f9-43a4-b7fa-5e82b4c7da41', 'a71ea961-10dd-4b60-9a3f-ded8750df0fe', 'VODKA ORLOFF'],
    ['c7b2a929-2f07-42a2-adf9-897d551dcf54', '42fd2079-771e-493b-b495-2db1bcb4f3c2', 'WHISK JACK DANIELS']
];
const uniqueProductId = '1325d3db-9448-4500-ad2d-9e50ce7e4843';

async function run() {
    const preview = { mode: apply ? 'apply' : 'preview', links: links.map(([, centralId, name]) => ({ name, centralId })), create: 'AGUA TONICA SEM ACUCAR', ignored: ['MOSTER DE MANGA ERRADO', '.'] };
    if (apply) await prisma.$transaction(async tx => {
        for (const [productId, centralId, name] of links) {
            const result = await tx.product.updateMany({ where: { id: productId, establishmentId: COMMERCIAL_ID, organizationProductId: null }, data: { organizationProductId: centralId } });
            if (result.count !== 1) throw new Error(`Produto ${name} mudou durante a revisao.`);
            await tx.auditLog.create({ data: { actionType: 'LINK_REVIEWED', entityType: 'ORGANIZATION_PRODUCT', entityId: centralId, description: `${name} vinculado apos revisao automatizada assistida.`, establishmentId: COMMERCIAL_ID } });
        }
        const product = await tx.product.findUnique({ where: { id: uniqueProductId } });
        if (!product || product.organizationProductId) throw new Error('AGUA TONICA SEM ACUCAR mudou durante a revisao.');
        const sequence = await tx.organizationProductSequence.upsert({ where: { organizationId: ORGANIZATION_ID }, create: { organizationId: ORGANIZATION_ID, currentValue: 1 }, update: { currentValue: { increment: 1 } }, select: { currentValue: true } });
        const central = await tx.organizationProduct.create({ data: { organizationId: ORGANIZATION_ID, internalCode: `PROD-${String(sequence.currentValue).padStart(6, '0')}`, name: product.name, baseUnit: product.unit || 'unidade', isActive: true } });
        await tx.product.update({ where: { id: product.id }, data: { organizationProductId: central.id } });
        await tx.auditLog.create({ data: { actionType: 'CREATE_AND_LINK', entityType: 'ORGANIZATION_PRODUCT', entityId: central.id, description: 'AGUA TONICA SEM ACUCAR criada como identidade distinta de agua mineral.', establishmentId: COMMERCIAL_ID } });
        preview.createdCentralId = central.id;
    }, { maxWait: 15000, timeout: 60000 });
    console.log(JSON.stringify(preview, null, 2));
}

run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
