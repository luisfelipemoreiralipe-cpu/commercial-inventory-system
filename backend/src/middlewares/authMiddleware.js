const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const [scheme, token] = authHeader.split(' ');

        if (!scheme || !token) {
            return res.status(401).json({ error: 'Token mal formatado' });
        }

        if (scheme !== 'Bearer') {
            return res.status(401).json({ error: 'Token mal formatado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = {
            id: decoded.userId,
            establishmentId: decoded.establishmentId
        }

        next();

    } catch (error) {
        return res.status(401).json({
            error: 'Token inválido ou expirado'
        });
    }
}

module.exports = authMiddleware;