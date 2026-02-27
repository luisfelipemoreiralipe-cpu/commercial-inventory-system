const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const AppError = require('../utils/AppError');

const register = async ({ nome, email, senha }) => {
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) throw new AppError('Email já cadastrado.', 400);

    const senha_hash = await bcrypt.hash(senha, 10);

    const user = await prisma.users.create({
        data: { nome, email, senha_hash }
    });

    return user;
};

const login = async ({ email, senha }) => {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) throw new AppError('Credenciais inválidas.', 401);

    const valid = await bcrypt.compare(senha, user.senha_hash);
    if (!valid) throw new AppError('Credenciais inválidas.', 401);
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    return { token };
};

module.exports = { register, login };