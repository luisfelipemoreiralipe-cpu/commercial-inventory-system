const auditLogService = require('../services/auditLogService');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
    const { entityType } = req.query;
    const data = await auditLogService.getLogs({ entityType, establishmentId: req.user.establishmentId });
    res.json({ success: true, data });
});

module.exports = { getAll };
