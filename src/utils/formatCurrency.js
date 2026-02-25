/**
 * Formats a number as Brazilian Real (BRL) currency.
 * @param {number} value
 * @returns {string}
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

/**
 * Formats a number with thousands separator (pt-BR locale).
 * @param {number} value
 * @returns {string}
 */
export const formatNumber = (value) => {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
};
