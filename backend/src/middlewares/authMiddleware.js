const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

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

        // 🔎 validar se o usuário tem acesso ao estabelecimento
        const relation = await prisma.userEstablishment.findFirst({
            where: {
                userId: decoded.userId,
                establishmentId: decoded.establishmentId
            }
        });

        if (!relation) {
            return res.status(403).json({
                error: 'Usuário não tem acesso a este estabelecimento'
            });
        }

        req.user = {
            userId: decoded.userId,
            establishmentId: decoded.establishmentId
        };

        next();

    } catch (error) {

        return res.status(401).json({
            error: 'Token inválido ou expirado'
        });

    }

}

module.exports = authMiddleware;