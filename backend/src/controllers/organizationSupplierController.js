const service = require('../services/organizationSupplierService');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => res.json({ success: true, data: await service.list(req.user.establishmentId) }));
const getById = asyncHandler(async (req, res) => res.json({ success: true, data: await service.getById(req.params.id, req.user.establishmentId) }));
const reviewCandidates = asyncHandler(async (req, res) => res.json({ success: true, data: await service.listReviewCandidates(req.user.establishmentId) }));
const create = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.create(req.body, req.user.establishmentId, req.user.userId) }));
const update = asyncHandler(async (req, res) => res.json({ success: true, data: await service.update(req.params.id, req.body, req.user.establishmentId, req.user.userId) }));
const deactivate = asyncHandler(async (req, res) => res.json({ success: true, data: await service.update(req.params.id, { isActive: false }, req.user.establishmentId, req.user.userId) }));
const approveCandidate = asyncHandler(async (req, res) => {
    const data = await service.approveCandidate(req.body, req.user.establishmentId, req.user.userId);
    res.status(data.idempotent ? 200 : 201).json({ success: true, data });
});
const rejectCandidate = asyncHandler(async (req, res) => res.json({ success: true, data: await service.rejectCandidate(req.body, req.user.establishmentId, req.user.userId) }));

module.exports = { list, getById, reviewCandidates, create, update, deactivate, approveCandidate, rejectCandidate };
