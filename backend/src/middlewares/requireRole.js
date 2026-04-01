module.exports = function requireRole(allowedRoles = []) {
    return (req, res, next) => {

        const userRole = req.user?.role;
        console.log("ALLOWED ROLES:", allowedRoles);
        console.log("USER ROLE:", userRole);

        if (!userRole) {
            return res.status(401).json({
                error: 'Usuário sem role'
            });
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Acesso negado para este perfil'
            });
        }

        next();
    };
};