const {z}=require('zod');
const password=z.string().min(10).max(128).regex(/[A-Z]/,'Inclua uma letra maiúscula.').regex(/[a-z]/,'Inclua uma letra minúscula.').regex(/[0-9]/,'Inclua um número.');
const login=z.object({email:z.string().trim().email().max(254),password:z.string().min(1).max(128)}).strict();
const createUser=z.object({name:z.string().trim().min(2).max(120),email:z.string().trim().email().max(254),password}).strict();
const reset=z.object({token:z.string().min(32).max(256),password}).strict();
const requestReset=z.object({email:z.string().trim().email().max(254)}).strict();
const submitPrices=z.object({note:z.string().trim().max(1000).nullable().optional(),items:z.array(z.object({catalogItemId:z.string().uuid(),packagePrice:z.coerce.number().positive(),commercialUnit:z.string().trim().min(1).max(30),unitsPerPackage:z.coerce.number().positive(),available:z.boolean(),deliveryLeadDays:z.coerce.number().int().min(0).max(365).nullable().optional()}).strict()).min(1).max(500)}).strict();
module.exports={password,login,createUser,reset,requestReset,submitPrices};
