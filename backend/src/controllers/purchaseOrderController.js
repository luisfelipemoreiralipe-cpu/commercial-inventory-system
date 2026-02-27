const purchaseOrderService = require('../services/purchaseOrderService');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
    const data = await purchaseOrderService.getAllOrders();
    res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
    const data = await purchaseOrderService.createOrder(req.body);
    res.status(201).json({ success: true, data });
});

const complete = asyncHandler(async (req, res) => {
    const data = await purchaseOrderService.completeOrder(req.params.id);
    res.json({ success: true, data });
});

const remove = asyncHandler(async (req, res) => {
    await purchaseOrderService.deleteOrder(req.params.id);
    res.status(204).send();
});

// 🆕 EXPORTAR PDF
const exportPdf = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const pdfBuffer = await purchaseOrderService.generatePdf(id);

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