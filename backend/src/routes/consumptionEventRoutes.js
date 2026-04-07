const express = require('express');
const router = express.Router();
const consumptionEventController = require('../controllers/consumptionEventController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.post('/checkout', consumptionEventController.checkout);
router.post('/checkin', consumptionEventController.checkin);
router.get('/', consumptionEventController.list);
router.get('/:id/report', consumptionEventController.getReport);

module.exports = router;
