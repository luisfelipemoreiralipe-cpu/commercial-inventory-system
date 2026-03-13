const stockTransferService = require('../services/stockTransferService');

const createTransfer = async (req, res) => {

    try {

        const { productId, quantity, toEstablishmentId } = req.body;

        console.log("REQ.USER:", req.user);

        const transfer = await stockTransferService.transferStock({
            productId,
            quantity,
            fromEstablishmentId: req.user.establishmentId,
            toEstablishmentId,
            userId: req.user.userId
        });

        res.json({
            success: true,
            data: transfer
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Erro ao transferir estoque'
        });

    }

};

module.exports = {
    createTransfer
};