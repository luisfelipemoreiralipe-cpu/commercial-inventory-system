const { Router } = require('express');
const controller = require('../controllers/categoryController');
const validate = require('../middlewares/validate');
const {
    createCategorySchema,
    updateCategorySchema,
} = require('../validations/categoryValidation');

const router = Router();

router.get('/', controller.getAll);
router.post('/', validate(createCategorySchema), controller.create);
router.put('/:id', validate(updateCategorySchema), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
