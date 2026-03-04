import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3333',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 🔐 Adiciona token automaticamente
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Interceptador de respostas
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        const message =
            error.response?.data?.message ||
            'Erro de comunicação com o servidor.';
        return Promise.reject(new Error(message));
    }
);

export default api;
