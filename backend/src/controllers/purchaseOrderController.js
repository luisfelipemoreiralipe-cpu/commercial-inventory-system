const purchaseOrderService = require('../services/purchaseOrderService');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
    const establishmentId = req.user.establishmentId;
    const data = await purchaseOrderService.getAllOrders(establishmentId);
    res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const establishmentId = req.user.establishmentId;

    const data = await purchaseOrderService.createOrder({
        ...req.body,
        userId: userId,
        user_id: userId,
        establishmentId
    });

    res.status(201).json({ success: true, data });
});

const complete = asyncHandler(async (req, res) => {
    const { items } = req.body;
    const establishmentId = req.user.establishmentId;

    const data = await purchaseOrderService.completeOrder(
        req.params.id,
        establishmentId,
        items
    );

    res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
    const establishmentId = req.user.establishmentId;
    await purchaseOrderService.deleteOrder(req.params.id, establishmentId);
    res.status(204).send();
});

// EXPORTAR PDF
const exportPdf = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const establishmentId = req.user.establishmentId;

    const pdfBuffer = await purchaseOrderService.generatePdf(id, establishmentId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=ordem-${id.slice(-6).toUpperCase()}.pdf`
    );

    res.send(pdfBuffer);
});

module.exports = {
    getAll,
    create,
    complete,
    remove,
    exportPdf
};