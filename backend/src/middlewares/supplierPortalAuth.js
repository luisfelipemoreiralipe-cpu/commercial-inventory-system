const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

module.exports = async function supplierPortalAuth(req,res,next){
 try{
  const [scheme,token]=String(req.headers.authorization||'').split(' ');
  if(scheme!=='Bearer'||!token) return res.status(401).json({success:false,message:'Sessão inválida.'});
  const decoded=jwt.verify(token,process.env.JWT_SECRET,{audience:'supplier-portal',issuer:'commercial-api'});
  if(decoded.tokenType!=='SUPPLIER_PORTAL'||!decoded.portalUserId) throw new Error('invalid token type');
  const user=await prisma.supplierPortalUser.findUnique({where:{id:decoded.portalUserId},include:{organizationSupplier:{select:{id:true,name:true,organizationId:true,isActive:true}}}});
  if(!user||!user.isActive||user.isBlocked||user.revokedAt||!user.organizationSupplier.isActive||user.sessionVersion!==decoded.sessionVersion) return res.status(401).json({success:false,message:'Sessão inválida.'});
  req.supplierPortal={userId:user.id,organizationSupplierId:user.organizationSupplierId,organizationId:user.organizationSupplier.organizationId,user:{id:user.id,name:user.name,email:user.email},supplier:user.organizationSupplier};
  next();
 }catch(_error){return res.status(401).json({success:false,message:'Sessão expirada ou inválida.'});}
};
