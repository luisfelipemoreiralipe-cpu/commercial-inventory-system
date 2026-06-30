const { PrismaClient } = require('@prisma/client');

const prismaClientSingleton = () => {
    const client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });

    // Middleware para retry automático em erros de conexão
    client.$use(async (params, next) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY_MS = 1000;

        let lastError;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                return await next(params);
            } catch (error) {
                lastError = error;
                const isConnectionError =
                    error.message?.includes('enetunreach') ||
                    error.message?.includes('Server has closed the connection') ||
                    error.message?.includes('Connection refused') ||
                    error.message?.includes('Connection timed out') ||
                    error.message?.includes('Too many connections') ||
                    error.message?.includes('Can\'t reach database server') ||
                    error.code === 'P1001' || // Can't reach database server
                    error.code === 'P1002' || // Database server timed out
                    error.code === 'P1008' || // Operations timed out
                    error.code === 'P1017';   // Server has closed the connection

                if (isConnectionError && attempt < MAX_RETRIES) {
                    console.warn(
                        `[PRISMA RETRY] ${params.model}.${params.action} - Attempt ${attempt}/${MAX_RETRIES} failed. Retrying in ${RETRY_DELAY_MS}ms...`,
                        error.message?.substring(0, 100)
                    );
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));

                    // Tenta reconectar
                    try {
                        await client.$disconnect();
                        await client.$connect();
                    } catch (reconnectError) {
                        console.warn('[PRISMA RETRY] Reconnect attempt failed:', reconnectError.message?.substring(0, 100));
                    }
                } else {
                    throw error;
                }
            }
        }
        throw lastError;
    });

    return client;
};

const prisma = global.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    global.prismaGlobal = prisma;
}

module.exports = prisma;
