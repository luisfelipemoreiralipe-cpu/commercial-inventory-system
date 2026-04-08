const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function register({ nome, email, password }) {
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) throw new Error('Email já cadastrado');

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
        const establishment = await tx.establishment.create({
            data: { nome_fantasia: `${nome} Restaurante` }
        });

        const user = await tx.users.create({
            data: {
                nome,
                email,
                senha_hash: hashedPassword,
                establishmentId: establishment.id
            }
        });

        await tx.userEstablishment.create({
            data: { userId: user.id, establishmentId: establishment.id }
        });

        return { user, establishment };
    });

    return result;
}

async function login({ email, password }) {
    const user = await prisma.users.findUnique({
        where: { email },
        include: { userEstablishments: { include: { establishment: true } } }
    });

    if (!user) throw new Error('Credenciais inválidas');

    const valid = await bcrypt.compare(password, user.senha_hash);
    if (!valid) throw new Error('Credenciais inválidas');

    const establishments = user.userEstablishments.map(ue => ue.establishment);
    const defaultEst = establishments[0];

    const token = jwt.sign(
        { userId: user.id, establishmentId: defaultEst?.id },
        JWT_SECRET,
        { expiresIn: '1d' }
    );

    return {
        token,
        user: { id: user.id, nome: user.nome, email: user.email },
        establishments
    };
}

async function getContext({ userId, establishmentId }) {
    const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
            userEstablishments: {
                include: {
                    establishment: { include: { organization: true } }
                }
            }
        }
    });

    if (!user) throw new Error("Usuário não encontrado");

    const currentUE = user.userEstablishments.find(ue => ue.establishmentId === establishmentId);

    return {
        user: { id: user.id, nome: user.nome, email: user.email },
        establishment: currentUE?.establishment || null,
        organization: currentUE?.establishment?.organization || null,
        establishments: user.userEstablishments.map(ue => ue.establishment)
    };
}

async function switchEstablishment({ userId, establishmentId }) {
    const token = jwt.sign({ userId, establishmentId }, JWT_SECRET, { expiresIn: '1d' });
    return { token };
}

module.exports = { 
    register, 
    login, 
    getContext, 
    switchEstablishment 
};
