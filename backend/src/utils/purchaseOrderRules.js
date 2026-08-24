const AppError = require('./AppError');

const validateAutomaticOrderClassifications = (products, generationMode) => {
    if (generationMode !== 'AUTOMATIC') return;
    const classifications = new Set(products.map(product => product.purchaseClassification));
    if (classifications.size > 1) {
        throw new AppError('Uma ordem de compra nÃ£o pode misturar classificaÃ§Ãµes diferentes.', 400);
    }
};

module.exports = { validateAutomaticOrderClassifications };
