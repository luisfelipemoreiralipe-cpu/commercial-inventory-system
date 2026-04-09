const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

// 📝 REGISTRO
const register = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, data: user });
});

// 🔑 LOGIN
const login = asyncHandler(async (req, res) => {
    const data = await authService.login(req.body);
    res.json({ success: true, data });
});

// 🏢 TROCAR ESTABELECIMENTO
const switchEstablishment = asyncHandler(async (req, res) => {
    const { establishmentId } = req.body;

    // 🛡️ Captura o ID do usuário de qualquer lugar do token
    const userId = req.user?.id || req.user?.userId || req.user?.sub;

    const data = await authService.switchEstablishment({ userId, establishmentId });
    res.json({ success: true, data });
});

// 👤 OBTER CONTEXTO (User, Org, Est)
const getContext = asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    const establishmentId = req.user?.establishmentId;

    const data = await authService.getContext({ userId, establishmentId });
    res.json({ success: true, data });
});

// 🆔 OBTER DADOS DO USUÁRIO LOGADO (Rota /me)
const me = asyncHandler(async (req, res) => {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    const establishmentId = req.user?.establishmentId;

    const data = await authService.getContext({ userId, establishmentId });
    res.json({ success: true, user: data.user, establishment: data.establishment });
});

module.exports = {
    register,
    login,
    switchEstablishment,
    getContext,
    me
};
