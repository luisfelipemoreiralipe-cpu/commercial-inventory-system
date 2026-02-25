const auditLogRepo = require('../repositories/auditLogRepository');

const getLogs = (filters) => auditLogRepo.findAll(filters);

module.exports = { getLogs };
