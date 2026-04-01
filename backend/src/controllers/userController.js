const userService = require('../services/userService');

const create = async (req, res) => {
    try {
        const { nome, email, senha, role, establishmentIds } = req.body;

        const user = await userService.create({
            nome,
            email,
            senha,
            role,
            establishmentIds
        });

        return res.json(user);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};
const prisma = require('../config/prisma');

const list = async (req, res) => {
    try {
        const users = await prisma.users.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
                role: true
            }
        });

        return res.json(users);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao listar usuários' });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, role } = req.body;

        const user = await userService.update(id, {
            nome,
            email,
            role
        });

        return res.json(user);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

module.exports = {
    create,
    list,
    update
};