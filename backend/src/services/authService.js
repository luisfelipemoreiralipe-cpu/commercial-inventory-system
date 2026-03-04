const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/
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

    // 3️⃣ Transação: criar usuário + establishment
    const result = await prisma.$transaction(async (tx) => {

        const user = await tx.users.create({
            data: {
                nome: nome,
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
        await tx.category.createMany({
            data: [
                { name: 'Bebidas', establishmentId: establishment.id },
                { name: 'Carnes', establishmentId: establishment.id },
                { name: 'Hortifruti', establishmentId: establishment.id },
                { name: 'Laticínios', establishmentId: establishment.id },
                { name: 'Limpeza', establishmentId: establishment.id },
                { name: 'Secos', establishmentId: establishment.id }
            ]
        });

        return { user, establishment };
    });

    // 4️⃣ Retorna dados seguros (sem senha)
    return {
        id: result.user.id,
        nome: result.user.nome,
        email: result.user.email,
        establishmentId: result.establishment.id
    };
}


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/
async function login({ email, password }) {

    // 1️⃣ Buscar usuário por email
    const user = await prisma.users.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error('Credenciais inválidas');
    }

    // 2️⃣ Comparar senha
    const passwordMatch = await bcrypt.compare(password, user.senha_hash);

    if (!passwordMatch) {
        throw new Error('Credenciais inválidas');
    }

    // 3️⃣ Buscar establishment vinculado
    const establishment = await prisma.establishment.findFirst({
        where: { user_id: user.id }
    });

    if (!establishment) {
        throw new Error('Estabelecimento não encontrado');
    }

    // 4️⃣ Gerar JWT
    const token = jwt.sign(
        {
            userId: user.id,
            establishmentId: establishment.id
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1d'
        }
    );

    return {
        token,
        user: {
            id: user.id,
            nome: user.nome,
            email: user.email
        }
    };
}

module.exports = {
    register,
    login
};