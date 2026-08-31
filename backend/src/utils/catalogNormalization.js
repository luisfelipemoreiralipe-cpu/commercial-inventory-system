const normalizeText = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ');

const normalizeBarcode = value => {
    const digits = String(value || '').replace(/\D/g, '');
    return digits || null;
};

const buildProductCandidateKey = product => [
    normalizeText(product.name),
    normalizeText(product.unit),
    normalizeText(product.purchaseUnit),
    Number(product.packQuantity || 1).toString()
].join('|');

module.exports = {
    normalizeText,
    normalizeBarcode,
    buildProductCandidateKey
};
