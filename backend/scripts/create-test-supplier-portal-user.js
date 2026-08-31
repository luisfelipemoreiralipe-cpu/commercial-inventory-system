require('dotenv').config();
const prisma=require('../src/utils/prisma');const bcrypt=require('bcryptjs');const auth=require('../src/services/supplierPortalAuthService');
const LOCAL_SUPPLIER_ID=process.env.TEST_PORTAL_LOCAL_SUPPLIER_ID;const EMAIL=process.env.TEST_PORTAL_EMAIL;const PASSWORD=process.env.TEST_PORTAL_PASSWORD;
async function run(){
 if(!LOCAL_SUPPLIER_ID||!EMAIL||!PASSWORD)throw new Error('Configure TEST_PORTAL_LOCAL_SUPPLIER_ID, TEST_PORTAL_EMAIL e TEST_PORTAL_PASSWORD.');
 const local=await prisma.supplier.findUnique({where:{id:LOCAL_SUPPLIER_ID},include:{establishment:true,organizationSupplier:true}});if(!local||!local.establishment.organizationId)throw new Error('Fornecedor de teste não encontrado ou sem organização.');
 const result=await prisma.$transaction(async tx=>{
  let central=local.organizationSupplier;
  if(!central)central=await tx.organizationSupplier.create({data:{organizationId:local.establishment.organizationId,name:'Açougue Teste E2E',legalName:'Fornecedor Fictício para Testes E2E',cnpj:String(local.cnpj||'').replace(/\D/g,''),isActive:true}});
  await tx.supplier.update({where:{id:local.id},data:{organizationSupplierId:central.id}});
  const existing=await tx.supplierPortalUser.findUnique({where:{email:EMAIL}});
  const user=existing?await tx.supplierPortalUser.update({where:{id:existing.id},data:{organizationSupplierId:central.id,name:'Usuário Fornecedor Teste E2E',passwordHash:await bcrypt.hash(PASSWORD,12),isActive:true,isBlocked:false,revokedAt:null,failedLoginAttempts:0,lockedUntil:null,sessionVersion:{increment:1}}}):await tx.supplierPortalUser.create({data:{organizationSupplierId:central.id,name:'Usuário Fornecedor Teste E2E',email:EMAIL,passwordHash:await bcrypt.hash(PASSWORD,12)}});
  await tx.auditLog.create({data:{actionType:'CREATE_TEST_ACCOUNT',entityType:'SUPPLIER_PORTAL_USER',entityId:user.id,description:'Conta fictícia controlada criada para teste do portal.',establishmentId:local.establishmentId}});
  return{central,user};
 });
 const session=await auth.login({email:EMAIL,password:PASSWORD});
 console.log(JSON.stringify({valid:Boolean(session.token),supplier:{id:result.central.id,name:result.central.name},localSupplier:{id:local.id,name:local.name,establishment:local.establishment.name},user:{id:result.user.id,name:result.user.name,email:result.user.email},portalPath:'/supplier-portal/login'},null,2));
}
run().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
