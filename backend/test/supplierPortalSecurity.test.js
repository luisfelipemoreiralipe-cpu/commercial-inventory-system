const test=require('node:test');const assert=require('node:assert/strict');const jwt=require('jsonwebtoken');
const prismaPath=require.resolve('../src/utils/prisma');const middlewarePath=require.resolve('../src/middlewares/supplierPortalAuth');
test('middleware externo resolve fornecedor pelo usuário do token e ignora IDs do frontend',async()=>{
 process.env.JWT_SECRET='test-secret-with-enough-entropy';
 require.cache[prismaPath]={id:prismaPath,filename:prismaPath,loaded:true,exports:{supplierPortalUser:{findUnique:async()=>({id:'user-a',organizationSupplierId:'supplier-a',name:'Vendedor',email:'v@a.com',isActive:true,isBlocked:false,revokedAt:null,sessionVersion:2,organizationSupplier:{id:'supplier-a',name:'Fornecedor A',organizationId:'org-a',isActive:true}})}}};
 delete require.cache[middlewarePath];const middleware=require('../src/middlewares/supplierPortalAuth');
 const token=jwt.sign({tokenType:'SUPPLIER_PORTAL',portalUserId:'user-a',sessionVersion:2},process.env.JWT_SECRET,{audience:'supplier-portal',issuer:'commercial-api'});
 const req={headers:{authorization:`Bearer ${token}`},body:{organizationSupplierId:'supplier-b'}};let next=false;
 await middleware(req,{status(){return this;},json(payload){throw new Error(JSON.stringify(payload));}},()=>{next=true;});
 assert.equal(next,true);assert.equal(req.supplierPortal.organizationSupplierId,'supplier-a');
});
test('middleware externo rejeita token interno',async()=>{
 process.env.JWT_SECRET='test-secret-with-enough-entropy';delete require.cache[middlewarePath];const middleware=require('../src/middlewares/supplierPortalAuth');
 const token=jwt.sign({userId:'internal'},process.env.JWT_SECRET);
 let status;await middleware({headers:{authorization:`Bearer ${token}`}}, {status(value){status=value;return this;},json(){}},()=>{});assert.equal(status,401);
});
