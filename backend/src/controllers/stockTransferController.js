const stockTransferService = require('../services/stockTransferService');


// =============================
// CRIAR TRANSFERÊNCIA
// =============================
const createTransfer = async (req, res) => {
    console.log("REQ.USER:", req.user);

    try {

        const { productId, quantity, toEstablishmentId } = req.body;

        const transfer = await stockTransferService.createTransfer({
            productId,
            quantity,
            fromEstablishmentId: req.user.establishmentId,
            toEstablishmentId,
            userId: req.user.id
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

    const { id } = req.params;

    const result = await stockTransferService.approveTransfer(
        id,
        req.user.id
    );

    res.json({
        success: true,
        message: "Transferência aprovada",
        data: result
    });

};
const getSentTransfers = async (req, res) => {

    const transfers = await stockTransferService.getSentTransfers(
        req.user.establishmentId
    );

    res.json({
        success: true,
        data: transfers
    });

};


const getReceivedTransfers = async (req, res) => {

    const transfers = await stockTransferService.getReceivedTransfers(
        req.user.establishmentId
    );

    res.json({
        success: true,
        data: transfers
    });

}



// =============================
// REJEITAR TRANSFERÊNCIA
// =============================
const rejectTransfer = async (req, res) => {

    const { id } = req.params;

    const result = await stockTransferService.rejectTransfer(
        id,
        req.user.id
    );

    res.json({
        success: true,
        message: "Transferência rejeitada",
        data: result
    });

};


module.exports = {
    createTransfer,
    approveTransfer,
    rejectTransfer,
    getSentTransfers,
    getReceivedTransfers
};