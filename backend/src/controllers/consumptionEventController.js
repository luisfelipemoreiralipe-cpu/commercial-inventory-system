const asyncHandler = require('../utils/asyncHandler');
const consumptionEventService = require('../services/consumptionEventService');

const checkout = asyncHandler(async (req, res) => {
    const { name, items } = req.body;
    const establishmentId = req.user.establishmentId;

    if (!name || !items || !items.length) {
        return res.status(400).json({ success: false, message: 'Nome e itens são obrigatórios' });
    }

    try {
        const event = await consumptionEventService.startEvent({ name, establishmentId, items });
        res.json({ success: true, event });
    } catch (error) {
        if (error.message.includes('Estoque insuficiente')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        throw error;
    }
});

const checkin = asyncHandler(async (req, res) => {
    const { eventId, items } = req.body;
    const establishmentId = req.user.establishmentId;

    if (!eventId || !items) {
        return res.status(400).json({ success: false, message: 'ID do evento e itens de retorno são obrigatórios' });
    }

    await consumptionEventService.checkInLeftovers({ eventId, items, establishmentId });
    res.json({ success: true, message: 'Evento encerrado e sobras devolvidas com sucesso' });
});

const getReport = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const establishmentId = req.user.establishmentId;
    const report = await consumptionEventService.getEventReport(id, establishmentId);
    res.json({ success: true, report });
});

const list = asyncHandler(async (req, res) => {
    const establishmentId = req.user.establishmentId;
    const events = await consumptionEventService.listEvents(establishmentId);
    res.json({ success: true, events });
});

module.exports = {
    checkout,
    checkin,
    getReport,
    list
};
