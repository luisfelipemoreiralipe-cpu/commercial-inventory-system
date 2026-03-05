import axios from "axios";

const API_URL = "http://localhost:3333";

export const getProducts = async () => {
    const res = await axios.get(`${API_URL}/products`);
    return res.data.data;
};

export const getSupplierComparison = async (productId) => {
    const res = await axios.get(
        `${API_URL}/products/${productId}/supplier-comparison`
    );
    return res.data.data;
};