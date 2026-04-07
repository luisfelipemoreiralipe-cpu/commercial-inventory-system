const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/
async function register({ nome, email, password }) {

    const existingUser = await prisma.users.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new Error('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {

        // 1️⃣ Criar estabelecimento
        const establishment = await tx.establishment.create({
            data: {
                nome_fantasia: `${nome} Restaurante`
            }
        });


        // 2️⃣ Criar usuário
        const user = await tx.users.create({
            data: {
                nome,
                email,
                senha_hash: hashedPassword,
                establishmentId: establishment.id
            }
        });

        // 3️⃣ Criar relação usuário ↔ estabelecimento
        await tx.userEstablishment.create({
            data: {
                userId: user.id,
                establishmentId: establishment.id
            }
        });

        // 4️⃣ Criar categorias padrão (SaaS Padrão)
        const defaultCategories = [
            'Cervejas', 'Destilados', 'Refrigerantes', 
            'Sucos & Águas', 'Insumos', 'Limpeza', 
            'Carnes', 'Hortifruti', 'Embalagens'
        ];

        await tx.category.createMany({
            data: defaultCategories.map(name => ({
                name,
                establishmentId: establishment.id
            })),
            skipDuplicates: true
        });

        return { user, establishment };
    });

    return {
        id: result.user.id,
        nome: result.user.nome,
        email: result.user.email,
        establishmentId: result.establishment.id
    };
}


async function getContext({ userId, id, establishmentId }) {

    const uid = userId || id;

    if (!uid) {
        throw new Error("Usuário não identificado no contexto");
    }

    const user = await prisma.users.findUnique({
        where: { id: uid },
        include: {
            userEstablishments: {
                include: {
                    establishment: {
                        include: {
                            organization: true
                        }
                    }
                }
            }
        }
    });

    if (!user) {
        throw new Error("Usuário não encontrado");
    }

    const currentEstablishment = user.userEstablishments.find(
        ue => ue.establishment.id === establishmentId
    );

    const establishments = user.userEstablishments.map(ue => ({
        id: ue.establishment.id,
        nome_fantasia: ue.establishment.nome_fantasia
    }));

    return {
        user: {
            id: user.id,
            nome: user.nome,
            email: user.email
        },
        establishment: currentEstablishment?.establishment || null,
        organization: currentEstablishment?.establishment?.organization || null,
        establishments
    };
}

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/
async function login({ email, password }) {

    const user = await prisma.users.findUnique({
        where: { email },
        include: {
            userEstablishments: {
                include: {
                    establishment: true
                }
            }
        }
    });

    if (!user) {
        throw new Error('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(password, user.senha_hash);

    if (!passwordMatch) {
        throw new Error('Credenciais inválidas');
    }

    const establishments = user.userEstablishments.map((ue) => ({
        id: ue.establishment.id,
        nome_fantasia: ue.establishment.nome_fantasia
    }));

    const defaultEstablishment = establishments[0];

    const token = jwt.sign(
        {
            userId: user.id,
            establishmentId: defaultEstablishment?.id
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    return {
        token,
        user: {
            id: user.id,
            nome: user.nome,
            email: user.email
        },
        establishments
    };
}

/*
|--------------------------------------------------------------------------
| SWITCH ESTABLISHMENT
|--------------------------------------------------------------------------
*/
async function switchEstablishment({ userId, establishmentId }) {

    const relation = await prisma.userEstablishment.findFirst({
        where: {
            userId,
            establishmentId
        }
    });

    if (!relation) {
        throw new Error('Usuário não tem acesso a este estabelecimento');
    }

    const token = jwt.sign(
        {
            userId,
            establishmentId
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    return { token };
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/
module.exports = {
    register,
    login,
    switchEstablishment,
    getContext
};