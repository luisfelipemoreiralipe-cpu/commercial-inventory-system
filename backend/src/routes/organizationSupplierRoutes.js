const { Router } = require('express');
const controller = require('../controllers/organizationSupplierController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');
const validate = require('../middlewares/validate');
const schemas = require('../validations/organizationSupplierValidation');

const router = Router();
router.use(authMiddleware);
router.get('/', controller.list);
router.get('/review-candidates', controller.reviewCandidates);
router.post('/review-candidates/approve', requireRole(['ADMIN']), validate(schemas.approveCandidateSchema), controller.approveCandidate);
router.post('/review-candidates/reject', requireRole(['ADMIN']), validate(schemas.rejectCandidateSchema), controller.rejectCandidate);
router.get('/:id', controller.getById);
router.post('/', requireRole(['ADMIN']), validate(schemas.createSchema), controller.create);
router.put('/:id', requireRole(['ADMIN']), validate(schemas.updateSchema), controller.update);
router.delete('/:id', requireRole(['ADMIN']), controller.deactivate);

module.exports = router;
