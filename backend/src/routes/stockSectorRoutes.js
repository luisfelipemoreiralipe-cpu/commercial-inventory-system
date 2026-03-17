const { Router } = require("express");
const { PrismaClient } = require("@prisma/client");
const authMiddleware = require("../middlewares/authMiddleware");

const prisma = new PrismaClient();
const router = Router();

router.get("/", authMiddleware, async (req, res) => {

    try {

        const establishmentId = req.user.establishmentId;

        const sectors = await prisma.stockSector.findMany({
            where: {
                establishmentId
            },
            orderBy: {
                name: "asc"
            }
        });

        res.json(sectors);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Erro ao buscar setores"
        });

    }

});

module.exports = router;