const categoryRepo = require('../repositories/categoryRepository');
const AppError = require('../utils/AppError');

const getAllCategories = () => categoryRepo.findAll();

const getCategoryById = async (id) => {
    const category = await categoryRepo.findById(id);
    if (!category) throw new AppError('Categoria não encontrada.', 404);
    return category;
};

const createCategory = async (data) => {
    const existing = await categoryRepo.findByName(data.name);
    if (existing) throw new AppError('Categoria com este nome já existe.', 400);

    const category = await categoryRepo.create(data);
    return category;
};

const updateCategory = async (id, data) => {
    await getCategoryById(id);

    if (data.name) {
        const existing = await categoryRepo.findByName(data.name);
        if (existing && existing.id !== id) {
            throw new AppError('Categoria com este nome já existe.', 400);
        }
    }

    const updated = await categoryRepo.update(id, data);
    return updated;
};

const deleteCategory = async (id) => {
    await getCategoryById(id);
    await categoryRepo.remove(id);
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};
