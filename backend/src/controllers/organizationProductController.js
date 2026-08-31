const service = require('../services/organizationProductService');
const asyncHandler = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
    const data = await service.list(req.user.establishmentId);
    res.json({ success: true, data });
});

const getById = asyncHandler(async (req, res) => {
    const data = await service.getById(req.params.id, req.user.establishmentId);
    res.json({ success: true, data });
});

const listUnlinked = asyncHandler(async (req, res) => {
    const data = await service.listUnlinked(req.user.establishmentId);
    res.json({ success: true, data });
});

const listReviewCandidates = asyncHandler(async (req, res) => {
    const data = await service.listReviewCandidates(req.user.establishmentId);
    res.json({ success: true, data });
});

const approveReviewCandidate = asyncHandler(async (req, res) => {
    const data = await service.approveReviewCandidate(
        req.body,
        req.user.establishmentId,
        req.user.userId
    );
    res.status(data.idempotent ? 200 : 201).json({ success: true, data });
});

const rejectReviewCandidate = asyncHandler(async (req, res) => {
    const data = await service.rejectReviewCandidate(
        req.body,
        req.user.establishmentId,
        req.user.userId
    );
    res.json({ success: true, data });
});

const create = asyncHandler(async (req, res) => {
    const data = await service.create(req.body, req.user.establishmentId, req.user.userId);
    res.status(201).json({ success: true, data });
});

const update = asyncHandler(async (req, res) => {
    const data = await service.update(req.params.id, req.body, req.user.establishmentId, req.user.userId);
    res.json({ success: true, data });
});

const deactivate = asyncHandler(async (req, res) => {
    const data = await service.deactivate(req.params.id, req.user.establishmentId, req.user.userId);
    res.json({ success: true, data });
});

const linkProducts = asyncHandler(async (req, res) => {
    const data = await service.linkProducts(
        req.params.id,
        req.body.productIds,
        req.user.establishmentId,
        req.user.userId
    );
    res.json({ success: true, data });
});

const unlinkProduct = asyncHandler(async (req, res) => {
    await service.unlinkProduct(
        req.params.id,
        req.params.productId,
        req.user.establishmentId,
        req.user.userId
    );
    res.status(204).send();
});

module.exports = {
    list,
    getById,
    listUnlinked,
    listReviewCandidates,
    approveReviewCandidate,
    rejectReviewCandidate,
    create,
    update,
    deactivate,
    linkProducts,
    unlinkProduct
};
