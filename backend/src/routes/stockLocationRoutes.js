const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getStockLocations,
  createStockLocation,
  updateStockLocation,
  deleteStockLocation,
  internalTransfer
} = require('../controllers/stockLocationController');

router.use(authMiddleware);

router.get('/', getStockLocations);
router.post('/', createStockLocation);
router.post('/transfer', internalTransfer);
router.put('/:id', updateStockLocation);
router.delete('/:id', deleteStockLocation);

module.exports = router;
