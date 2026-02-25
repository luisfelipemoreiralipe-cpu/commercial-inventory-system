export const loadFromStorage = (key, fallback = []) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

export const saveToStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('LocalStorage write error:', e);
    }
};

export const STORAGE_KEYS = {
    PRODUCTS: 'inv_products',
    SUPPLIERS: 'inv_suppliers',
    PURCHASE_ORDERS: 'inv_purchase_orders',
    STOCK_MOVEMENTS: 'inv_stock_movements',
    AUDIT_LOGS: 'inv_audit_logs',
};
