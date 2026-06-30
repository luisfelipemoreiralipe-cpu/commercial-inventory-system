import api from "./api";

// 🔐 USANDO O INSTANCE PADRONIZADO (AXIOS)
// Já inclui o token e o prefixo /api automaticamente.

export const getProductSuppliers = async (productId) => {
    return api.get(`/products/${productId}/suppliers`);
};

export const addProductSupplier = async (productId, supplierId, price, syncNetwork = true) => {
    return api.post(`/products/${productId}/suppliers`, {
        supplierId,
        price,
        syncNetwork
    });
};

export const removeProductSupplier = async (productId, supplierId) => {
    return api.delete(`/products/${productId}/suppliers/${supplierId}`);
};