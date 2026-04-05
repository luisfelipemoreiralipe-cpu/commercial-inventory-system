import api from "./api";

export const getProducts = async () => {
    const res = await api.get("/products");
    return res;
};

export const getSupplierComparison = async (productId) => {
    const res = await api.get(
        `/products/${productId}/supplier-comparison`
    );
    return res;
};