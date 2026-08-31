const service = require('../services/supplierPriceUpdateService');
const asyncHandler = require('../utils/asyncHandler');
const { listQuerySchema } = require('../validations/supplierPriceUpdateValidation');
const list = asyncHandler(async (req,res)=>{
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(422).json({success:false,message:'Filtros inválidos.',errors:parsed.error.flatten().fieldErrors});
    if (parsed.data.dateTo) parsed.data.dateTo.setUTCHours(23,59,59,999);
    return res.json({success:true,data:await service.list(req.user.establishmentId,parsed.data)});
});
const catalog = asyncHandler(async (req,res)=>res.json({success:true,data:await service.catalog(req.params.organizationSupplierId,req.user.establishmentId)}));
const getById = asyncHandler(async (req,res)=>res.json({success:true,data:await service.getById(req.params.id,req.user.establishmentId)}));
const preview = asyncHandler(async (req,res)=>res.json({success:true,data:await service.preview(req.params.id,req.user.establishmentId)}));
const create = asyncHandler(async (req,res)=>res.status(201).json({success:true,data:await service.create(req.body,req.user.establishmentId,req.user.userId)}));
const apply = asyncHandler(async (req,res)=>res.json({success:true,data:await service.apply(req.params.id,req.user.establishmentId,req.user.userId)}));
const reject = asyncHandler(async (req,res)=>res.json({success:true,data:await service.reject(req.params.id,req.body.reason,req.user.establishmentId,req.user.userId)}));
module.exports={list,catalog,getById,preview,create,apply,reject};
