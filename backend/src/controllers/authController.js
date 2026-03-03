const prisma = require('../config/prisma');

exports.register = async (req, res, next) => {
    try {
        const { email } = req.body;

        const existingUser = await prisma.users.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email já cadastrado'
            });
        }

        return res.json({
            success: true,
            message: 'Email disponível'
        });

    } catch (error) {
        next(error);
    }
};