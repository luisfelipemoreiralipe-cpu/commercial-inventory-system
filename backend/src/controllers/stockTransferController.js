const stockTransferService = require('../services/stockTransferService');

// =============================
// CRIAR TRANSFERÊNCIA
// =============================
const createTransfer = async (req, res) => {
    try {
        const { productId, quantity, toEstablishmentId } = req.body;

        // 🛡️ Rede de segurança para pegar o ID do usuário
        const userId = req.user?.id || req.user?.userId || req.user?.sub || req.userId;
        const establishmentId = req.user?.establishmentId;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Usuário não identificado." });
        }

        const transfer = await stockTransferService.createTransfer({
            productId,
            quantity,
            fromEstablishmentId: establishmentId,
            toEstablishmentId,
            userId: userId // 👈 Agora garantido!
        });

        res.json({
            success: true,
            data: transfer
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// =============================
// APROVAR TRANSFERÊNCIA
// =============================
const approveTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.user?.userId || req.user?.sub || req.userId;

        const result = await stockTransferService.approveTransfer(
            id,
            userId // 👈 Protegido
        );

        res.json({
            success: true,
            message: "Transferência aprovada",
            data: result
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const getSentTransfers = async (req, res) => {
    const establishmentId = req.user?.establishmentId;
    const transfers = await stockTransferService.getSentTransfers(establishmentId);

    res.json({
        success: true,
        data: transfers
    });
};

const completeTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.user?.userId || req.user?.sub || req.userId;

        const result = await stockTransferService.completeTransfer(
            id,
            userId // 👈 Protegido
        );

        res.json({
            success: true,
            message: "Transferência concluída com sucesso",
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getReceivedTransfers = async (req, res) => {
    const establishmentId = req.user?.establishmentId;
    const transfers = await stockTransferService.getReceivedTransfers(establishmentId);

    res.json({
        success: true,
        data: transfers
    });
};

// =============================
// REJEITAR TRANSFERÊNCIA
// =============================
const rejectTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.user?.userId || req.user?.sub || req.userId;

        const result = await stockTransferService.rejectTransfer(
            id,
            userId // 👈 Protegido
        );

        res.json({
            success: true,
            message: "Transferência rejeitada",
            data: result
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    createTransfer,
    approveTransfer,
    rejectTransfer,
    getSentTransfers,
    getReceivedTransfers,
    completeTransfer
};