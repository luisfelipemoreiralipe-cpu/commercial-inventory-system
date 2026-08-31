import api from './api';

const organizationProductService = {
  list: () => api.get('/organization-products'),
  listUnlinked: () => api.get('/organization-products/unlinked-products'),
  listReviewCandidates: () => api.get('/organization-products/review-candidates'),
  approveReviewCandidate: data => api.post('/organization-products/review-candidates/approve', data),
  rejectReviewCandidate: candidateKey => api.post('/organization-products/review-candidates/reject', { candidateKey }),
  create: data => api.post('/organization-products', data),
  update: (id, data) => api.put(`/organization-products/${id}`, data),
  deactivate: id => api.delete(`/organization-products/${id}`),
  link: (id, productIds) => api.post(`/organization-products/${id}/links`, { productIds }),
  unlink: (id, productId) => api.delete(`/organization-products/${id}/links/${productId}`),
};

export default organizationProductService;
