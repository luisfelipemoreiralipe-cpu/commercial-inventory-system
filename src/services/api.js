import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
    baseURL: "http://localhost:3333",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json"
    }
});

// 🔐 Adiciona token automaticamente
api.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;

});

// 📡 Interceptador de respostas
api.interceptors.response.use(

    (response) => {
        return response.data;
    },

    (error) => {

        const status = error.response?.status;

        if (status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }

        const message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Erro de comunicação com o servidor.";

        // 🔥 TOAST AUTOMÁTICO
        if (status === 403) {
            toast.error("Você não tem permissão para essa ação");
        } else if (status !== 401) {
            toast.error(message);
        }

        return Promise.reject(new Error(message));

    }

);

export default api;
