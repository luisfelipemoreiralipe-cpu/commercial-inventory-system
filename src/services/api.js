import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3333',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptador global de respostas
// Ele extrai e extrai unicamente a propriedade ".data" dos retornos formatados do seu servidor ( { success: true, data: { ... } } )
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        // Organiza mensagens de fallback do Backend para melhor legibilidade no Front-End 
        const message = error.response?.data?.message || 'Erro de comunicação com o servidor.';
        return Promise.reject(new Error(message));
    }
);

export default api;
