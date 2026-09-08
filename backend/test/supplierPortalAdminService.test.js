const test=require('node:test');
const assert=require('node:assert/strict');
const bcrypt=require('bcryptjs');
const prismaPath=require.resolve('../src/utils/prisma');
const servicePath=require.resolve('../src/services/supplierPortalAdminService');
function setup({missing=false,duplicate=false}={}){
 const calls={};
 const db={
  establishments:{findUnique:async()=>({organizationId:'org-a'})},
  supplierPortalUser:{
   findMany:async query=>{calls.list=query;return [];},
   findFirst:async query=>{calls.scope=query;return missing?null:{id:'user-a',email:'old@example.com'};},
   findUnique:async()=>duplicate?{id:'other'}:null,
   update:async query=>{calls.update=query;return {id:'user-a',name:query.data.name,email:query.data.email};}
  },
  auditLog:{create:async query=>{calls.audit=query;}},
  $transaction:async callback=>callback(db)
 };
 require.cache[prismaPath]={id:prismaPath,filename:prismaPath,loaded:true,exports:db};
 delete require.cache[servicePath];
 return {service:require(servicePath),calls};
}
test('lista todos os logins apenas da organização sem retornar hashes',async()=>{
 const {service,calls}=setup();await service.listAll('est-a');
 assert.deepEqual(calls.list.where,{organizationSupplier:{organizationId:'org-a'}});
 assert.equal(calls.list.select.passwordHash,undefined);
 assert.equal(calls.list.select.organizationSupplier.select.name,true);
});
test('edição recusa conta fora da organização e email duplicado',async()=>{
 for(const options of [{missing:true},{duplicate:true}]){
  const {service,calls}=setup(options);
  await assert.rejects(service.update('user-a',{name:'Valdir',email:'new@example.com'},'est-a','admin'),e=>e.statusCode===(options.missing?404:409));
  assert.equal(calls.update,undefined);
  assert.equal(calls.scope.where.organizationSupplier.organizationId,'org-a');
 }
});
test('editar nome mantém senha; trocar senha gera hash e invalida sessões e recuperação',async()=>{
 let {service,calls}=setup();
 await service.update('user-a',{name:' Valdir ',email:'old@example.com'},'est-a','admin');
 assert.equal(calls.update.data.passwordHash,undefined);
 assert.equal(calls.update.data.sessionVersion,undefined);
 assert.equal(calls.update.data.name,'Valdir');
 ({service,calls}=setup());
 await service.update('user-a',{name:'Valdir',email:' NEW@example.com ',password:'123456'},'est-a','admin');
 assert.equal(await bcrypt.compare('123456',calls.update.data.passwordHash),true);
 assert.equal(calls.update.data.email,'new@example.com');
 assert.deepEqual(calls.update.data.sessionVersion,{increment:1});
 assert.equal(calls.update.data.passwordResetTokenHash,null);
 assert.ok(calls.audit);
 assert.equal(JSON.stringify(calls.audit).includes('123456'),false);
});
test('schema de edição aceita senha opcional e recusa troca de fornecedor',()=>{
 const {updateUser}=require('../src/validations/supplierPortalValidation');
 const input={name:'Valdir',email:'v@example.com'};
 assert.equal(updateUser.safeParse(input).success,true);
 assert.equal(updateUser.safeParse({...input,password:'123456'}).success,true);
 assert.equal(updateUser.safeParse({...input,password:'123'}).success,false);
 assert.equal(updateUser.safeParse({...input,organizationSupplierId:'other'}).success,false);
});
