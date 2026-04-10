/**
 * Helper para forçar o isolamento de dados por estabelecimento (Multi-Tenancy).
 * Extrai o establishmentId do objeto de request populado pelo authMiddleware.
 */
const tenantFilter = (req) => {
    if (!req.user || !req.user.establishmentId) {
        throw new Error('Contexto de estabelecimento ausente no request.');
    }
    return {
        establishmentId: req.user.establishmentId
    };
};

module.exports = {
    tenantFilter
};
