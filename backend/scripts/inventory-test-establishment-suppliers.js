require('dotenv').config();
const prisma=require('../src/utils/prisma');
const establishmentName=process.argv[2]||'teste';
async function run(){const rows=await prisma.supplier.findMany({where:{establishment:{name:{contains:establishmentName,mode:'insensitive'}}},select:{id:true,name:true,cnpj:true,establishment:{select:{id:true,name:true}},organizationSupplier:{select:{id:true,name:true,_count:{select:{catalogItems:true,portalUsers:true}}}}},orderBy:{establishment:{name:'asc'}}});console.log(JSON.stringify(rows,null,2));}
run().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
