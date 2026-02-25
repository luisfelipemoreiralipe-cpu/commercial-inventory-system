const stockMovementRepo = require('../repositories/stockMovementRepository');

const getMovements = (filters) => stockMovementRepo.findAll(filters);

module.exports = { getMovements };
