const stockTransferService = require('../services/stockTransferService');

// =============================
// CRIAR TRANSFERÊNCIA
// =============================
const createTransfer = async (req, res) => {
    try {
        const { productId, quantity, toEstablishmentId } = req.body;
        const userId = req.user.userId;
        const establishmentId = req.user.establishmentId;

        const transfer = await stockTransferService.createTransfer({
            productId,
            quantity,
            fromEstablishmentId: establishmentId,
            toEstablishmentId,
            userId
        });

        res.json({ success: true, data: transfer });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// =============================
// APROVAR TRANSFERÊNCIA
// =============================
const approveTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const establishmentId = req.user.establishmentId;

        const result = await stockTransferService.approveTransfer(id, userId, establishmentId);

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

const getReceivedTransfers = async (req, res) => {
    const transfers = await stockTransferService.getReceivedTransfers(req.user.establishmentId);
    res.json({ success: true, data: transfers });
};

// =============================
// REJEITAR TRANSFERÊNCIA
// =============================
const rejectTransfer = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const establishmentId = req.user.establishmentId;

        const result = await stockTransferService.rejectTransfer(id, userId, establishmentId);

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
    getReceivedTransfers
};