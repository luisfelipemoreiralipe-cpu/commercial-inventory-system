const authService = require('../services/authService');

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/
async function register(req, res) {
    try {
        const { nome, email, password } = req.body;

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

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email e password são obrigatórios'
            });
        }

        const result = await authService.login({
            email,
            password
        });

        return res.status(200).json(result);

    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }
}

async function context(req, res) {

    try {

        const result = await authService.getContext({
            userId: req.user.userId,
            establishmentId: req.user.establishmentId
        });

        res.json({
            success: true,
            data: result
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

}

async function switchEstablishment(req, res) {

    try {

        const { establishmentId } = req.body;

        const result = await authService.switchEstablishment({
            userId: req.user.userId,
            establishmentId
        });

        res.json({
            success: true,
            token: result.token
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }

}
/*
|--------------------------------------------------------------------------
| ME (rota protegida para validar token)
|--------------------------------------------------------------------------
*/
async function me(req, res) {
    return res.status(200).json({
        message: 'Token válido',
        user: req.user
    });
}

module.exports = {
    register,
    login,
    me,
    switchEstablishment,
    context
};