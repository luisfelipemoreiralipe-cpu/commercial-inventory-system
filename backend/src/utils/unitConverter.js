const convertToBaseUnit = (quantity, unit) => {
    console.log(`[CONVERSOR] Convertendo: ${quantity} | Unidade: ${unit}`);
    if (!quantity) return 0;

    const unitLower = unit?.toLowerCase();

    let result = 0;
    switch (unitLower) {
        // 🔵 VOLUME (Base é ml)
        case 'l':
        case 'litro':
        case 'litros':
            result = Number(quantity) * 1000; // 1 Litro = 1.000 no banco (ml)
            break;

        case 'ml':
            result = Number(quantity); // 25ml = 25 no banco
            break;

        // 🟡 PESO (Base é g)
        case 'kg':
        case 'quilo':
        case 'quilograma':
            result = Number(quantity) * 1000; // 1 KG = 1.000 no banco (g)
            break;

        case 'g':
        case 'grama':
        case 'gramas':
            result = Number(quantity); // 500g = 500 no banco
            break;

        // ⚪ UNIDADE
        case 'un':
        case 'unidade':
        case 'unidades':
            result = Number(quantity);
            break;

        default:
            result = Number(quantity);
    }
    console.log(`Convertendo ${quantity} ${unit} -> ${result}`);
    return result;
};

module.exports = { convertToBaseUnit };