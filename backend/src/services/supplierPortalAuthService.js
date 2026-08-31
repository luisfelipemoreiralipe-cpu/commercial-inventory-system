const prisma=require('../utils/prisma');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const crypto=require('node:crypto');
const AppError=require('../utils/AppError');
const normalizeEmail=value=>String(value).trim().toLowerCase();
const genericError=()=>new AppError('Credenciais inválidas.',401);
const login=async({email,password})=>{
 const normalized=normalizeEmail(email);
 const user=await prisma.supplierPortalUser.findUnique({where:{email:normalized},include:{organizationSupplier:true}});
 if(!user){await bcrypt.compare(password,'$2b$12$C6UzMDM.H6dfI/f/IKcEe.yrI4x6uOQ6rYqQq4n8hM8gB7A0gK7iK');throw genericError();}
 const now=new Date();
 if(!user.isActive||user.isBlocked||user.revokedAt||!user.organizationSupplier.isActive) throw genericError();
 if(user.lockedUntil&&user.lockedUntil>now) throw new AppError('Acesso temporariamente bloqueado. Tente novamente mais tarde.',429);
 const valid=await bcrypt.compare(password,user.passwordHash);
 if(!valid){const attempts=user.failedLoginAttempts+1;await prisma.supplierPortalUser.update({where:{id:user.id},data:{failedLoginAttempts:attempts,lockedUntil:attempts>=5?new Date(Date.now()+15*60*1000):null}});throw genericError();}
 await prisma.supplierPortalUser.update({where:{id:user.id},data:{failedLoginAttempts:0,lockedUntil:null,lastLoginAt:now}});
 const token=jwt.sign({tokenType:'SUPPLIER_PORTAL',portalUserId:user.id,sessionVersion:user.sessionVersion},process.env.JWT_SECRET,{expiresIn:'8h',audience:'supplier-portal',issuer:'commercial-api'});
 return{token,user:{id:user.id,name:user.name,email:user.email},supplier:{id:user.organizationSupplier.id,name:user.organizationSupplier.name}};
};
const requestReset=async email=>{
 const user=await prisma.supplierPortalUser.findUnique({where:{email:normalizeEmail(email)}});
 if(user&&user.isActive&&!user.revokedAt){const raw=crypto.randomBytes(32).toString('hex');const hash=crypto.createHash('sha256').update(raw).digest('hex');await prisma.supplierPortalUser.update({where:{id:user.id},data:{passwordResetTokenHash:hash,passwordResetExpiresAt:new Date(Date.now()+30*60*1000)}});}
 return{message:'Se a conta existir, a recuperação será encaminhada pelo administrador responsável.'};
};
const resetPassword=async({token,password})=>{
 const hash=crypto.createHash('sha256').update(token).digest('hex');
 const user=await prisma.supplierPortalUser.findFirst({where:{passwordResetTokenHash:hash,passwordResetExpiresAt:{gt:new Date()},isActive:true,revokedAt:null}});
 if(!user) throw new AppError('Token inválido ou expirado.',422);
 await prisma.supplierPortalUser.update({where:{id:user.id},data:{passwordHash:await bcrypt.hash(password,12),passwordResetTokenHash:null,passwordResetExpiresAt:null,failedLoginAttempts:0,lockedUntil:null,sessionVersion:{increment:1}}});
 return{message:'Senha alterada com sucesso.'};
};
module.exports={normalizeEmail,login,requestReset,resetPassword};
