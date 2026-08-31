import api from './api';

const organizationSupplierService = {
  list: () => api.get('/organization-suppliers'),
  listReviewCandidates: () => api.get('/organization-suppliers/review-candidates'),
  approveCandidate: data => api.post('/organization-suppliers/review-candidates/approve', data),
  rejectCandidate: candidateKey => api.post('/organization-suppliers/review-candidates/reject', { candidateKey }),
  create: data => api.post('/organization-suppliers', data),
  update: (id, data) => api.put(`/organization-suppliers/${id}`, data),
  deactivate: id => api.delete(`/organization-suppliers/${id}`),
};

export default organizationSupplierService;
