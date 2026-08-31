import api from './api';
const supplierPriceUpdateService = {
  list:params=>api.get('/supplier-price-updates',{params}),
  create:data=>api.post('/supplier-price-updates',data),
  preview:id=>api.get(`/supplier-price-updates/${id}/preview`),
  apply:id=>api.post(`/supplier-price-updates/${id}/apply`),
  reject:(id,reason)=>api.post(`/supplier-price-updates/${id}/reject`,{reason}),
};
export default supplierPriceUpdateService;
