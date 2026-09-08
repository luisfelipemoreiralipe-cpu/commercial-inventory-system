const test=require('node:test');const assert=require('node:assert/strict');const schemas=require('../src/validations/supplierPortalValidation');
test('senha externa aceita seis caracteres sem exigir letras',()=>{
 for(const password of ['123456','abcdef','SenhaForte123']) assert.equal(schemas.password.safeParse(password).success,true);
 for(const password of ['','12345','a'.repeat(129)]) assert.equal(schemas.password.safeParse(password).success,false);
});
test('cadastro e recuperacao aceitam 123456 e rejeitam senha curta',()=>{
 for(const password of ['123456','12345']) {
  const expected=password.length===6;
  assert.equal(schemas.createUser.safeParse({name:'Valdir',email:'sanguine@bds.com',password}).success,expected);
  assert.equal(schemas.reset.safeParse({token:'a'.repeat(64),password}).success,expected);
 }
});
test('lote externo não aceita organizationSupplierId forjado',()=>{const data={organizationSupplierId:'forged',items:[{catalogItemId:'11111111-1111-4111-8111-111111111111',packagePrice:10,commercialUnit:'cx',unitsPerPackage:1,available:true}]};assert.equal(schemas.submitPrices.safeParse(data).success,false);});
