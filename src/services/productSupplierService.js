const API = "http://localhost:3333";

const getToken = () => localStorage.getItem("token");

export const getProductSuppliers = async (productId) => {

    const res = await fetch(`${API}/products/${productId}/suppliers`, {
        headers: {
            Authorization: `Bearer ${getToken()}`
        }
    });

    return res.json();
};

export const addProductSupplier = async (productId, supplierId, price) => {

    const res = await fetch(`${API}/products/${productId}/suppliers`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
            supplierId,
            price
        })
    });

    return res.json();
};

export const removeProductSupplier = async (productId, supplierId) => {

    const res = await fetch(
        `${API}/products/${productId}/suppliers/${supplierId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );

    return res;
};