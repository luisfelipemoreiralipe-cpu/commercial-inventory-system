const { Router } = require('express');
const controller = require('../controllers/organizationProductController');
const authMiddleware = require('../middlewares/authMiddleware');
const requireRole = require('../middlewares/requireRole');
const validate = require('../middlewares/validate');
const {
    createOrganizationProductSchema,
    updateOrganizationProductSchema,
    linkOrganizationProductsSchema,
    approveProductCandidateSchema,
    rejectProductCandidateSchema
} = require('../validations/organizationProductValidation');

const router = Router();

router.use(authMiddleware);
router.get('/', controller.list);
router.get('/unlinked-products', controller.listUnlinked);
router.get('/review-candidates', controller.listReviewCandidates);
router.post('/review-candidates/approve', requireRole(['ADMIN']), validate(approveProductCandidateSchema), controller.approveReviewCandidate);
router.post('/review-candidates/reject', requireRole(['ADMIN']), validate(rejectProductCandidateSchema), controller.rejectReviewCandidate);
router.get('/:id', controller.getById);
router.post('/', requireRole(['ADMIN']), validate(createOrganizationProductSchema), controller.create);
router.put('/:id', requireRole(['ADMIN']), validate(updateOrganizationProductSchema), controller.update);
router.delete('/:id', requireRole(['ADMIN']), controller.deactivate);
router.post('/:id/links', requireRole(['ADMIN']), validate(linkOrganizationProductsSchema), controller.linkProducts);
router.delete('/:id/links/:productId', requireRole(['ADMIN']), controller.unlinkProduct);

module.exports = router;
