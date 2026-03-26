const categoryRepo = require('../repositories/categoryRepository');

const getAllCategories = async (establishmentId) => {
    const categories = await categoryRepo.findAllByEstablishment(establishmentId);
    return categories;
};

module.exports = {
    getAllCategories
};