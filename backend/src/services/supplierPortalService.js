const prisma=require('../utils/prisma');
const AppError=require('../utils/AppError');
const priceService=require('./supplierPriceUpdateService');
const catalog=portal=>prisma.supplierCatalogItem.findMany({where:{organizationSupplierId:portal.organizationSupplierId},include:{organizationProduct:{select:{id:true,internalCode:true,name:true,brand:true,baseUnit:true}}},orderBy:{organizationProduct:{name:'asc'}}});
const history=portal=>prisma.supplierPriceUpdate.findMany({where:{organizationSupplierId:portal.organizationSupplierId},include:{items:{include:{catalogItem:{include:{organizationProduct:{select:{internalCode:true,name:true}}}}}}},orderBy:{createdAt:'desc'}});
const submit=async(input,portal)=>{
 const ids=[...new Set(input.items.map(item=>item.catalogItemId))];if(ids.length!==input.items.length)throw new AppError('Não repita itens no lote.',422);
 const catalogItems=await prisma.supplierCatalogItem.findMany({where:{id:{in:ids},organizationSupplierId:portal.organizationSupplierId}});if(catalogItems.length!==ids.length)throw new AppError('Um ou mais itens não pertencem ao seu catálogo.',404);
 const byId=new Map(catalogItems.map(item=>[item.id,item]));
 const establishment=await prisma.establishments.findFirst({where:{organizationId:portal.organizationId},select:{id:true}});if(!establishment)throw new AppError('Organização sem estabelecimento operacional.',409);
 return priceService.create({organizationSupplierId:portal.organizationSupplierId,note:input.note||null,items:input.items.map(item=>{const current=byId.get(item.catalogItemId);return{organizationProductId:current.organizationProductId,supplierCode:current.supplierCode,commercialUnit:item.commercialUnit,unitsPerPackage:item.unitsPerPackage,packagePrice:item.packagePrice,available:item.available,minimumOrder:current.minimumOrder?Number(current.minimumOrder):null,deliveryLeadDays:item.deliveryLeadDays??null,validUntil:current.validUntil?.toISOString()||null};})},establishment.id,portal.userId);
};
module.exports={catalog,history,submit};
