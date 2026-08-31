require('dotenv').config();
const prisma=require('../src/utils/prisma');const bcrypt=require('bcryptjs');const auth=require('../src/services/supplierPortalAuthService');const portal=require('../src/services/supplierPortalService');
const email=`portal-smoke-${Date.now()}@example.invalid`;const password='SmokeSeguro123';let userId;
async function run(){
 const supplier=await prisma.organizationSupplier.findFirst({where:{isActive:true}});if(!supplier)throw new Error('Nenhum fornecedor central ativo para smoke.');
 const user=await prisma.supplierPortalUser.create({data:{organizationSupplierId:supplier.id,name:'Smoke Portal',email,passwordHash:await bcrypt.hash(password,12)}});userId=user.id;
 const session=await auth.login({email,password});
 const context={userId:user.id,organizationSupplierId:supplier.id,organizationId:supplier.organizationId};
 const [catalog,history]=await Promise.all([portal.catalog(context),portal.history(context)]);
 await prisma.supplierPortalUser.update({where:{id:user.id},data:{isActive:false,revokedAt:new Date(),sessionVersion:{increment:1}}});
 let revokedLoginDenied=false;try{await auth.login({email,password});}catch(error){revokedLoginDenied=error.statusCode===401;}
 if(!session.token||!revokedLoginDenied)throw new Error('Falha no ciclo de autenticação/revogação.');
 console.log(JSON.stringify({valid:true,supplierId:supplier.id,catalogItems:catalog.length,historyEntries:history.length,login:true,revokedLoginDenied},null,2));
}
run().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(async()=>{if(userId)await prisma.supplierPortalUser.deleteMany({where:{id:userId}});await prisma.$disconnect();});
