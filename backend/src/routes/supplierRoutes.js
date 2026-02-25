const { Router } = require('express');
const controller = require('../controllers/supplierController');
const validate = require('../middlewares/validate');
const {
    createSupplierSchema,
    updateSupplierSchema,
} = require('../validations/supplierValidation');

const router = Router();

router.get('/', controller.getAll);
router.post('/', validate(createSupplierSchema), controller.create);
router.put('/:id', validate(updateSupplierSchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
