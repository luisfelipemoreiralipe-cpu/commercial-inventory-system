import api from "./api";

export const getStockLocations = () => api.get("/stock-locations");
export const createStockLocation = (data) => api.post("/stock-locations", data);
export const updateStockLocation = (id, data) => api.put(`/stock-locations/${id}`, data);
export const deleteStockLocation = (id) => api.delete(`/stock-locations/${id}`);
export const internalTransfer = (data) => api.post("/stock-locations/transfer", data);
