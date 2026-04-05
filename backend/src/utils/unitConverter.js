const convertToBaseUnit = (quantity, unit) => {
    console.log(`[CONVERSOR] Convertendo: ${quantity} | Unidade: ${unit}`);
    if (!quantity) return 0;

    const unitLower = unit?.toLowerCase();

    let result = 0;
    switch (unitLower) {
        // 🔵 VOLUME (Base é Litro)
        case 'l':
        case 'litro':
        case 'litros':
            result = Number(quantity); // 1 Litro = 1.000 no banco
            break;

        case 'ml':
            result = Number(quantity) / 1000; // 25ml = 0.025 no banco
            break;

        // 🟡 PESO (Base é KG)
        case 'kg':
        case 'quilo':
        case 'quilograma':
            result = Number(quantity); // 1 KG = 1.000 no banco
            break;

        case 'g':
        case 'grama':
        case 'gramas':
            result = Number(quantity) / 1000; // 500g = 0.500 no banco
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