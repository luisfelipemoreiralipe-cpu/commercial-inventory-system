const serializePriceHistory = (history = []) => history.map((item, index) => {
    const price = Number(item.price);
    const previousItem = history[index + 1];
    const previousPrice = previousItem ? Number(previousItem.price) : null;
    const absoluteVariation = previousPrice === null ? null : price - previousPrice;
    const percentageVariation = previousPrice === null || previousPrice === 0
        ? null
        : (absoluteVariation / previousPrice) * 100;

    return {
        ...item,
        price,
        // Alias temporário para manter compatibilidade com consumidores antigos.
        unitPrice: price,
        supplierName: item.supplier?.name || null,
        previousPrice,
        absoluteVariation,
        percentageVariation
    };
});

module.exports = { serializePriceHistory };
