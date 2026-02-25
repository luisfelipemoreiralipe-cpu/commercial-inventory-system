/**
 * Generates a unique ID using timestamp + random suffix.
 * @returns {string}
 */
export const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
