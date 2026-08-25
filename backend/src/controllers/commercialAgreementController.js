const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/commercialAgreementService');

const list = asyncHandler(async (req, res) => {
    res.json({ success: true, data: await service.listAgreements(req.user.establishmentId) });
});

const create = asyncHandler(async (req, res) => {
    const data = await service.createAgreement({
        ...req.body,
        establishmentId: req.user.establishmentId,
        createdByUserId: req.user.userId
    });
    res.status(201).json({ success: true, data });
});

const receiveBonus = asyncHandler(async (req, res) => {
    const data = await service.receiveBonus({
        ...req.body,
        establishmentId: req.user.establishmentId,
        userId: req.user.userId
    });
    res.status(201).json({ success: true, data });
});

const summary = asyncHandler(async (req, res) => {
    const data = await service.getSummary(req.user.establishmentId, req.query.dateFrom, req.query.dateTo);
    res.json({ success: true, data });
});

module.exports = { list, create, receiveBonus, summary };
