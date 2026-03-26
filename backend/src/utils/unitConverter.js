const convertToBaseUnit = (quantity, unit) => {

    if (!quantity) return 0;

    switch (unit?.toLowerCase()) {

        // 🔵 VOLUME
        case 'l':
        case 'litro':
            return quantity * 1000;

        case 'ml':
            return quantity;

        // 🟡 PESO
        case 'kg':
        case 'quilo':
            return quantity * 1000;

        case 'g':
        case 'grama':
            return quantity;

        // ⚪ UNIDADE
        case 'un':
        case 'unidade':
            return quantity;

        default:
            throw new Error(`Unidade não suportada: ${unit}`);
    }
};

module.exports = {
    convertToBaseUnit
};