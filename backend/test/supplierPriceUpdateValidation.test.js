const test = require('node:test');
const assert = require('node:assert/strict');
const { createSchema, listQuerySchema } = require('../src/validations/supplierPriceUpdateValidation');
const base = { organizationSupplierId:'11111111-1111-4111-8111-111111111111',items:[{organizationProductId:'22222222-2222-4222-8222-222222222222',commercialUnit:'caixa',unitsPerPackage:12,packagePrice:120,available:true}] };
test('aceita lote de preço válido',()=>assert.equal(createSchema.safeParse(base).success,true));
test('rejeita preço negativo e campos desconhecidos',()=>{
    assert.equal(createSchema.safeParse({...base,items:[{...base.items[0],packagePrice:-1}]}).success,false);
    assert.equal(createSchema.safeParse({...base,organizationId:'forged'}).success,false);
});
test('pagina lotes com limite protegido e filtros válidos',()=>{
    const parsed=listQuerySchema.parse({page:'2',pageSize:'50',status:'SUBMITTED',search:'NW'});
    assert.equal(parsed.page,2);assert.equal(parsed.pageSize,50);
    assert.equal(listQuerySchema.safeParse({pageSize:'101'}).success,false);
    assert.equal(listQuerySchema.safeParse({status:'INVALID'}).success,false);
});
