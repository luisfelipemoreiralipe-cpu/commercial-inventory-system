const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');

async function register({ nome, email, password }) {

    // 1️⃣ Verifica se email já existe
    const existingUser = await prisma.users.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new Error('Email já cadastrado');
    }

    // 2️⃣ Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Criar user + establishment em transação
    const result = await prisma.$transaction(async (tx) => {

        const user = await tx.users.create({
            data: {
                nome: nome,              // 👈 aqui ajustado
                email: email,
                senha_hash: hashedPassword
            }
        });

        const establishment = await tx.establishment.create({
            data: {
                user_id: user.id,
                nome_fantasia: `${nome} Restaurante`
            }
        });

        return { user, establishment };
    });

    // 4️⃣ Retornar sem senha
    return {
        id: result.user.id,
        nome: result.user.nome,
        email: result.user.email,
        establishmentId: result.establishment.id
    };
}

module.exports = {
    register
};