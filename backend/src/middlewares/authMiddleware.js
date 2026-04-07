const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

async function authMiddleware(req, res, next) {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const [scheme, token] = authHeader.split(' ');

        if (!scheme || !token || scheme !== 'Bearer') {
            return res.status(401).json({ error: 'Token mal formatado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 🔥 pega establishment do header OU token
        const establishmentIdFromHeader = req.headers['x-establishment-id'];

        const establishmentId =
            establishmentIdFromHeader || decoded.establishmentId;

        // 🔎 valida acesso
        const relation = await prisma.userEstablishment.findFirst({
            where: {
                userId: decoded.userId,
                establishmentId
            }
        });

        if (!relation) {
            return res.status(403).json({
                error: 'Usuário não tem acesso a este estabelecimento'
            });
        }

        // 🔎 busca user (AGORA sim)
        const user = await prisma.users.findUnique({
            where: { id: decoded.userId },
            select: { role: true }
        });
        console.log("USER ROLE:", user.role);

        // 🔥 define req.user UMA VEZ só
        req.user = {
            id: decoded.userId,
            establishmentId,
            role: user.role
        };

        next();

    } catch (error) {

        console.error("AUTH ERROR:", error); // 👈 importante pra debug

        return res.status(401).json({
            error: 'Token inválido ou expirado'
        });

    }

}

module.exports = authMiddleware;