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

        // 🔥 Resiliência: Tenta pegar userId ou id do token
        const userId = decoded.userId || decoded.id;

        if (!userId) {
            return res.status(401).json({ error: 'Token inválido: Usuário não identificado' });
        }

        // 🔥 Pega establishment do header OU token
        const establishmentIdFromHeader = req.headers['x-establishment-id'];
        const establishmentId = establishmentIdFromHeader || decoded.establishmentId;

        // 🔎 valida acesso ao estabelecimento
        if (establishmentId) {
            const relation = await prisma.userEstablishment.findFirst({
                where: {
                    userId: userId,
                    establishmentId: establishmentId
                }
            });

            if (!relation) {
                return res.status(403).json({
                    error: 'Usuário não tem acesso a este estabelecimento'
                });
            }
        }

        // 🔎 busca user no banco para pegar a role atualizada
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        // 🔥 Define req.user para uso nos controllers
        req.user = {
            userId: userId,
            establishmentId: establishmentId,
            role: user.role
        };

        next();

    } catch (error) {
        console.error("AUTH ERROR:", error.message);
        return res.status(401).json({
            error: 'Sessão expirada ou inválida. Por favor, faça login novamente.'
        });
    }
}

module.exports = authMiddleware;