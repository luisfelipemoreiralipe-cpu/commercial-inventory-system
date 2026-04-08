const purchaseOrderService = require('../services/purchaseOrderService');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
    const establishmentId = req.user.establishmentId;

    const data = await purchaseOrderService.getAllOrders(establishmentId);
    res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
    console.log("BODY RECEBIDO:", req.body);
    console.log("DADOS DO TOKEN DO USUARIO:", req.user); // 👈 Isso vai nos mostrar os dados no log do Render!

    // 👈 A MÁGICA: Procuramos o ID em todas as variáveis comuns de JWT
    const userId = req.user?.id || req.user?.userId || req.user?.sub || req.userId;
    const establishmentId = req.user?.establishmentId;

    if (!userId) {
        throw new Error("ID do usuário não encontrado no token. Verifique o console.log do Render.");
    }

    const data = await purchaseOrderService.createOrder({
        ...req.body,
        userId: userId,     // Mandamos em camelCase
        user_id: userId,    // E também em snake_case (para não ter briga com o Repository)
        establishmentId
    });

    res.status(201).json({ success: true, data });
});

const complete = asyncHandler(async (req, res) => {

    const { items } = req.body; // 👈 TEM QUE EXISTIR

    const establishmentId = req.user?.establishmentId;

    const data = await purchaseOrderService.completeOrder(
        req.params.id,
        establishmentId,
        items // 👈 AGORA FUNCIONA
    );

    res.json({ success: true, data });

});

const remove = asyncHandler(async (req, res) => {
    await purchaseOrderService.deleteOrder(req.params.id);
    res.status(204).send();
});

// EXPORTAR PDF
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