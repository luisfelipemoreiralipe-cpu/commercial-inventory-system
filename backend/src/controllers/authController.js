const authService = require('../services/authService');

async function register(req, res) {
    try {
        const { nome, email, password } = req.body;

        // Validação simples (evita quebrar o serviço)
        if (!nome || !email || !password) {
            return res.status(400).json({
                error: 'Nome, email e password são obrigatórios'
            });
        }

        const user = await authService.register({
            nome,
            email,
            password
        });

        return res.status(201).json(user);

    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }
}

module.exports = {
    register
};