const categoryService = require('../services/categoryService');

const getAllCategories = async (req, res) => {

    const categories = await categoryService.getAllCategories(
        req.user.establishmentId
    );

    res.json({
        success: true,
        data: categories
    });

};

module.exports = {
    getAllCategories
};