const categoryRepo = require('../repositories/categoryRepository');

const getAllCategories = async () => {

    const categories = await categoryRepo.findAll();

    return categories;

};

module.exports = {
    getAllCategories
};